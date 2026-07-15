package social;

import java.util.List;
import java.util.Scanner;

public class Main {
	public static void main(String[] args){
        SocialNetwork sn = new SocialNetwork();
        Scanner sc = new Scanner(System.in);
        while(true){
            System.out.println("1.Create account\n2.Connect with friend\n3.Show friends list\n4.Quit\nEnter your choice:");
            int choice = sc.nextInt();
            switch(choice){
            case 1:
            	  System.out.println("Enter name:");
            	  String name = sc.next();
            	  System.out.println("Enter password:");
            	  String password = sc.next();
            	  String newID = sn.createAccount(name, password);
            	  System.out.println("Account successfully created with unique ID: " + newID);
            	  break;

                
            	  
            case 2:
                System.out.println("Enter your unique ID:");
                String uid = sc.next();
                System.out.println("Enter friend's unique ID:");
                String fuid = sc.next();
                try {
                    sn.connect(uid, fuid);
                    System.out.println("Successfully connected with the friend");
                } catch(IllegalArgumentException e) {
                    System.out.println("Failed to connect - " + e.getMessage());
                }
                break;
         
                
                case 3:
                System.out.println("Enter unique ID:");
                uid = sc.next();
                List<String> friends = sn.showFriends(uid);
                System.out.println("Friends list:");
                for(String id : friends){
                    System.out.println(id);
                }
                break;
                
                case 4:
                	System.out.println("Bye! see you later :)");
                    sc.close();
                    System.exit(0);
                
                default:
                System.out.println("Invalid choice. Please try again.");
            }
        }
    }
}


