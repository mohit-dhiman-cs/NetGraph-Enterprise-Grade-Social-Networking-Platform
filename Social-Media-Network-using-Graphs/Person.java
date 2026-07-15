package social;

import java.util.LinkedList;

class Person {
    String name;
    String uniqueID;
    String password;
    LinkedList<Person> friendList;
    Person(String name, String password, String uniqueID) {
        this.name = name;
        this.password = password;
        this.uniqueID = uniqueID;
        this.friendList = new LinkedList<>();
    }
}
