import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import StableMap "mo:map/Map";

import vetkd_system_api "canister:system_api";
import Hex "utils/Hex";

shared ({ caller = initializer }) actor class () {
	type Result<Ok, Err> = Result.Result<Ok, Err>;

  type Password = {
      id: Nat;
      owner: Principal;
      name: Text;
      username: Text;
      password: Text;
  };

  type TOTP = {
      id: Nat;
      owner: Principal;
      issuer: Text;
      secret: Text;
      name: Text;
  };

  type Group = {
      id: Nat;
      owner: Principal;
      name: ?Text;
      members: [Principal];
  };

  private stable var nextPasswordId : Nat = 1;
  private stable var nextTOTPId : Nat = 1;
  private stable var nextGroupId : Nat = 1;

  private stable let userPasswords = StableMap.new<Principal, [Nat]>();
  private stable let userTOTPs = StableMap.new<Principal, [Nat]>();
  private stable let userGroups = StableMap.new<Principal, [Nat]>();

  private stable let passwords = StableMap.new<Nat, Password>();
  private stable let totps = StableMap.new<Nat, TOTP>();
  private stable let groups = StableMap.new<Nat, Group>();

  public shared ({ caller }) func createPassword(
      encryptedName: Text,
      encryptedUsername: Text,
      encryptedPassword: Text,
  ): async Result<Nat, Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous user is not allowed");
    };

    let passwordId = nextPasswordId;
    nextPasswordId += 1;

    let password: Password = {
      id = passwordId;
      owner = caller;
      name = encryptedName;
      username = encryptedUsername;
      password = encryptedPassword;
    };

    StableMap.set(passwords, StableMap.nhash, passwordId, password);
    addToUserCollection(caller, passwordId, userPasswords);
    #ok(passwordId)
  };

  public shared query ({ caller }) func getPasswords() : async Result<[Password], Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous user is not allowed");
    };

    #ok(getUserItems(caller, userPasswords, passwords))
  };

public shared ({ caller }) func updatePassword(
  passwordId : Nat,
  encryptedName: Text,
  encryptedUsername: Text,
  encryptedPassword: Text
) : async Result<(), Text> {
  if (Principal.isAnonymous(caller)) {
    return #err("Anonymous user is not allowed");
  };

  if (not isOwner(caller, passwordId, userPasswords)) {
      return #err("Not authorized");
  };

  let (?_password) = StableMap.get(passwords, StableMap.nhash, passwordId) else {
      return #err("Password not found");
  };

  let updatedPassword : Password = {
      id = passwordId;
      owner = caller;
      name = encryptedName;
      username = encryptedUsername;
      password = encryptedPassword;
  };

  StableMap.set(passwords, StableMap.nhash, passwordId, updatedPassword);
  #ok()
};

  public shared ({ caller }) func deletePassword(
      passwordId : Nat
  ) : async Result<(), Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous user is not allowed");
    };

    if (not isOwner(caller, passwordId, userPasswords)) {
      return #err("Not authorized");
    };

    ignore StableMap.remove(passwords, StableMap.nhash, passwordId);
    removeFromUserCollection(caller, passwordId, userPasswords);

    #ok()
  };

  public shared ({ caller }) func createTOTP(
    encryptedLabel: Text,
    encryptedIssuer : Text,
    encryptedSecret : Text,
  ) : async Result<Nat, Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous user is not allowed");
    };

    let totpId = nextTOTPId;
    nextTOTPId += 1;

    let totp : TOTP = {
        id = totpId;
        owner = caller;
        secret = encryptedSecret;
        issuer = encryptedIssuer;
        name = encryptedLabel;
    };

    StableMap.set(totps, StableMap.nhash, totpId, totp);
    addToUserCollection(caller, totpId, userTOTPs);

    #ok(totpId)
  };

  public shared query ({ caller }) func getTOTPs() : async Result<[TOTP], Text> {
    if (Principal.isAnonymous(caller)) {
        return #err("Anonymous user is not allowed");
    };

    #ok(getUserItems(caller, userTOTPs, totps))
  };

  public shared ({ caller }) func updateTOTP(
      totpId : Nat,
      newEncryptedLabel: Text,
      newEncryptedIssuer : Text,
      newEncryptedSecret : Text,
  ) : async Result<(), Text> {
    if (Principal.isAnonymous(caller)) {
        return #err("Anonymous user is not allowed");
    };

    if (not isOwner(caller, totpId, userTOTPs)) {
        return #err("Not authorized");
    };

    let (?_totp) = StableMap.get(totps, StableMap.nhash, totpId) else {
        return #err("TOTP not found");
    };

    let updatedTOTP : TOTP = {
        id = totpId;
        owner = caller;
        secret = newEncryptedSecret;
        issuer = newEncryptedIssuer;
        name = newEncryptedLabel;
    };

    StableMap.set(totps, StableMap.nhash, totpId, updatedTOTP);
    #ok()
  };

  public shared ({ caller }) func deleteTOTPs(
      totpId : Nat
  ) : async Result<(), Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous user is not allowed");
    };

    if (not isOwner(caller, totpId, userTOTPs)) {
      return #err("Not authorized");
    };

    ignore StableMap.remove(passwords, StableMap.nhash, totpId);
    removeFromUserCollection(caller, totpId, userTOTPs);

    #ok()
  };

  func isOwner<T>(
      user : Principal,
      itemId : Nat,
      userCollection : StableMap.Map<Principal, [Nat]>
  ) : Bool {
    let itemIds = switch (StableMap.get(userCollection, StableMap.phash, user)) {
      case (?ids) { ids };
      case (null) { return false };
    };

    Array.find(itemIds, func(id : Nat) : Bool { id == itemId }) != null
  };

  func removeFromUserCollection(
      user : Principal,
      itemId : Nat,
      userCollection : StableMap.Map<Principal, [Nat]>
  ) {
    let itemIds = switch (StableMap.get(userCollection, StableMap.phash, user)) {
      case (null) { return };
      case (?ids) { ids };
    };

    let updatedIds = Array.filter(itemIds, func(id : Nat) : Bool { id != itemId });

    if (updatedIds.size() > 0) {
        StableMap.set(userCollection, StableMap.phash, user, updatedIds);
    } else {
        StableMap.delete(userCollection, StableMap.phash, user);
    };
  };

  func getUserItems<T>(
    user : Principal,
    userCollection : StableMap.Map<Principal, [Nat]>,
    itemMap : StableMap.Map<Nat, T>
) : [T] {
    let itemIds = switch (StableMap.get(userCollection, StableMap.phash, user)) {
        case (?ids) { ids };
        case (null) { [] };
    };

    let items = Buffer.Buffer<T>(0);
    for (id in itemIds.vals()) {
        switch (StableMap.get(itemMap, StableMap.nhash, id)) {
            case (?item) { items.add(item) };
            case (null) {};
        }
    };

    Buffer.toArray(items)
};

  func addToUserCollection(
      user : Principal,
      itemId : Nat,
      collection : StableMap.Map<Principal, [Nat]>
  ) {
    switch (StableMap.get(collection, StableMap.phash, user)) {
      case (?ids) {
          StableMap.set(collection, StableMap.phash, user, Array.append(ids, [itemId]));
      };
      case (null) {
          StableMap.set(collection, StableMap.phash, user, [itemId]);
      };
    };
  };

  public shared ({ caller = _ }) func symmetric_key_verification_key() : async Text {
    let { public_key } = await vetkd_system_api.vetkd_public_key({
      canister_id = null;
      derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
      key_id = { curve = #bls12_381_g2; name = "test_key_1" };
    });
    Hex.encode(Blob.toArray(public_key));
  };

  public shared ({ caller }) func encrypted_symmetric_key_for_caller(encryption_public_key : Blob) : async Text {
    let { encrypted_key } = await vetkd_system_api.vetkd_derive_encrypted_key({
      derivation_id = Principal.toBlob(caller);
      derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
      key_id = { curve = #bls12_381_g2; name = "test_key_1" };
      encryption_public_key;
    });
    Hex.encode(Blob.toArray(encrypted_key));
  };
};
