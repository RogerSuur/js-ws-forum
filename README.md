# real-time-forum
The goal of the project was to create a forum where you are able to message with other users in real time. 

### USAGE INSTRUCTIONS
1. Git clone https://01.kood.tech/git/jrms/real-time-forum.git to your desired folder
2. Open real-time-forum repository in your terminal
3. Start the server by running
```bash
go run src/server/*.go
```

Starting the server with the **optional** argument `-new` will generate a database that's prefilled with some dummy data to help the testing process.
```bash
go run src/server/*.go -new
```

In addition to registering new users you can use these logins to test the dummy data:
- Usernames: Jack, John, Kate, Mark, Susan, Vic666
- Password: 1234 (same for all test users)

### FEATURES
- Register a new user and login
- View posts
- Create new posts
- View post with it's comments
- Create new comments
- See a list of registered users with offline and online users separated
- Chat with other users in real time
- Get notifications when a new message is received or new post has been added

### IMPLEMENTATION
- SQLite3 database
- Gorilla websocket
- bcrypt password encryption
- Go backend (server, DB handling)
- HTML, CSS, vanilla JS frontend

#### Project authors:
- jrms
- Jollyroger
- mannakass

