package social;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;


class SocialNetwork {
    private HashMap<String, Person> usersGraph = new HashMap<>();
    String generateUniqueID() {
        String AlphaNumericString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789" + "abcdefghijklmnopqrstuvxyz";
        StringBuilder sb = new StringBuilder(5);
        for (int i = 0; i < 5; i++) {
            int index = (int) (AlphaNumericString.length() * Math.random());
            sb.append(AlphaNumericString.charAt(index));
        }
        return sb.toString();
    }
    String createAccount(String name, String password) {
        String uniqueID = generateUniqueID();
        usersGraph.put(uniqueID, new Person(name, password, uniqueID));
        return uniqueID;
    }
    
    void connect(String uid1, String uid2) {
        if (!usersGraph.containsKey(uid1) || !usersGraph.containsKey(uid2)) 
            throw new IllegalArgumentException("User not found.");
        usersGraph.get(uid1).friendList.add(usersGraph.get(uid2));
        usersGraph.get(uid2).friendList.add(usersGraph.get(uid1));
    }
    
    List<String> showFriends(String uid) {
        if(!usersGraph.containsKey(uid)) throw new IllegalArgumentException("User not found.");
        List<String> friendsList = new ArrayList<>();
        for(Person friend : usersGraph.get(uid).friendList) {
            friendsList.add(friend.uniqueID + " - " + friend.name);
        }
        return friendsList;
    }
}