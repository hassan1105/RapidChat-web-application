var currentUserId = '';
var friendUserId = '';
var chatSessionKey = '';
var flag = true;
////////
function openChat(fKey, fName, fPhotoUrl) {
    flag = true;
    friendUserId = fKey;
    var friend = { friendId: fKey, userId: currentUserId };
    var check = false;

    var db = firebase.database().ref('friend_list');
    db.on('value', function (friends) {
        friends.forEach(function (data) {
            var user = data.val();
            if ((user.friendId === fKey && user.userId === friend.userId) || (user.friendId === friend.userId && user.userId === friend.friendId)) {
                check = true;
                chatSessionKey = data.key;
            }

        });

        if (check === false) {
            chatSessionKey = firebase.database().ref('friend_list').push(friend, function (error) {
                if (error) {
                    alert(error);
                }
                else {
                    document.getElementById('messagePanel').removeAttribute('style');
                    document.getElementById('loadImg').setAttribute('style', 'display:none');
                }
            }).getKey();
        }
        else {
            document.getElementById('messagePanel').removeAttribute('style');
            document.getElementById('loadImg').setAttribute('style', 'display:none');
        }
        document.getElementById('chatFriendName').innerHTML = fName;
        document.getElementById('chatDP').src = fPhotoUrl;
        document.getElementById('messageList').innerHTML = '';

        enterPressed();

        document.getElementById('textInputField').value = '';
        document.getElementById('textInputField').focus();

        loadChat(chatSessionKey);
        //document.getElementById('messageList').scrollTo(0,document.getElementById('messageList').clientHeight);
        //var messageBody = document.querySelector('#messageList');
        //messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    });

}


function enterPressed() {
    document.addEventListener('keyup', function (key) {
        if (key.which == 13 ) {
            var msg = document.getElementById('textInputField').value
            if (msg !== '') {

                document.getElementById('textInputField').value = '';
                document.getElementById('textInputField').focus();
                send(msg);
            }

        }
    });
}
function sendClick() {
    var msg = document.getElementById('textInputField').value;
    if (msg !== '') {

        document.getElementById('textInputField').value = '';
        document.getElementById('textInputField').focus();
        send(msg);
    }
}

function send(msg) {
    var newChatMsg = { senderId: currentUserId, msg: msg, msgType: 'text', date: new Date().toLocaleString() };
    firebase.database().ref('messages').child(chatSessionKey).push(newChatMsg, function (error) {
        if (error) alert(error);
        else {
            firebase.database().ref('fcmtoken').child(friendUserId).once('value').then(function (data) {
                $.ajax({
                    url: 'https://fcm.googleapis.com/fcm/send',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'key=AAAAKTYpMh0:APA91bHXLJR6Q7zPbcxqQXPHbX452LdWHVXDOfuSDvuFn59g6_CzOHDCdlffX4_l9sBCF2EaC4UW9_z3lY_Yo6Fgem9Ge4YPq7071SsnbY69GU52ctDcjnZf7LpuBDEb0dSCJk6b3uur'
                    },
                    data: JSON.stringify({
                        'to': data.val().token_id, 'data': { 'message': newChatMsg.msg.substring(0, 30) + '...', 'icon': firebase.auth().currentUser.photoURL }
                    }),
                    success: function (response) {
                        console.log(response);
                    },
                    error: function (xhr, status, error) {
                        console.log(xhr.error);
                    }
                });
            });
            var messageBody = document.querySelector('#messageList');
            messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;

        }
    });

}

function selectImage() {
    document.getElementById('imgFile').click();
}

function sendImg(event) {
    var file = event.files[0];
    if (!file.type.match("image.*")) {
        alert("File type missmatch");
    }
    else {
        var fileReader = new FileReader();
        fileReader.addEventListener("load", function () {
            var newChatMsg = { senderId: currentUserId, msg: fileReader.result, msgType: 'image', date: new Date().toLocaleString() };
            firebase.database().ref('messages').child(chatSessionKey).push(newChatMsg, function (error) {
                if (error) alert(error);
                else {
                    var messageBody = document.querySelector('#messageList');
                    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
                }
            });
        }, false);
        if (file) {
            fileReader.readAsDataURL(file);
        }
    }
}

//////////////////////////////////////////////

function loadChat(chatSessionKey) {
    var datab = firebase.database().ref('messages').child(chatSessionKey);
    document.getElementById('messageList').innerHTML = '';
    datab.on('value', function (messages) {
        var message = '';
        messages.forEach(function (messageData) {
            var messageVal = messageData.val();
            var dateTime = messageVal.date.split(',');
            var msg = '';
            if (messageVal.msgType === 'image') {
                msg = '<img src = "' + messageVal.msg + '" class = "img-fluid"/>'
            }
            else if (messageVal.msgType === 'audio') {
                msg = '<audio id="audio" controls><source src="' + messageVal.msg + '" type="audio/webm"/></audio>';
            }
            else {
                msg = messageVal.msg
            }
            if (messageVal.senderId === currentUserId) {
                message += '<div class="row justify-content-end"><div class="col-6 col-sm-7 col-md-7" style="display: inline-block;"><p class="message-send-element float-right">' + msg + ' <span class="message-time float-right" title="' + dateTime[0] + '">' + dateTime[1] + '</span></p></div></div> ';
            }
            else {
                message += '<div class="row"><div class="col-6 col-sm-7 col-md-7" style="display: inline-block;"><p class="message-element">' + msg + ' <span class="message-time float-right" title="' + dateTime[0] + '">' + dateTime[1] + '</span></p></div></div>';
            }
        });
        document.getElementById('messageList').innerHTML = message;
        //document.getElementById('messageList').scrollTo(0,document.body.scrollHeight);
        var messageBody = document.querySelector('#messageList');
        messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    });
    document.getElementById('messageList').scrollTo(0, document.body.scrollHeight);
}

function loadContacts() {
    document.getElementById('loginBtnFront').style = 'display: none';
    document.getElementById('logoutBtnFront').style='';

    var datab = firebase.database().ref('friend_list');
    datab.on('value', function (pairs) {
        document.getElementById('contactList').innerHTML = ' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';
        pairs.forEach(function (data) {
            var pair = data.val();
            var friendId = '';
            if (pair.friendId === currentUserId) {
                friendId = pair.userId;
            }
            else if (pair.userId === currentUserId) {
                friendId = pair.friendId;
            }

            if (friendId !== '') {
                firebase.database().ref('users').child(friendId).on('value', function (data) {
                    var frnd = data.val();
                    document.getElementById('contactList').innerHTML += '<li class="list-group-item list-group-item-action" onclick="openChat(\'' + data.key + '\',\'' + frnd.name + '\',\'' + frnd.photoURL + '\')"><div class="row"><div class="col-md-2"><img src="' + frnd.photoURL + '" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">' + frnd.name + '</div><div class="latest-message">Hello</div></div></div></li>';
                });
            }
        });
    });
}

function showChatList() {
    document.getElementById('side-1').classList.remove('d-none','d-md-block');
    document.getElementById('side-2').classList.add('d-none');
}

function hideChatList() {
    document.getElementById('side-2').classList.remove('d-none','d-md-block');
    document.getElementById('side-1').classList.add('d-none');
}

function login() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    document.getElementById('loginBtnFront').style = 'display: none';
    document.getElementById('logoutBtnFront').style='';

}

function logout() {
    firebase.auth().signOut();
    document.getElementById('logoutBtnFront').style = 'display: none';
    document.getElementById('loginBtnFront').style='';
    document.getElementById('contactList').innerHTML='';
}

function onFirebaseStateChanged() {
    firebase.auth().onAuthStateChanged(onStateChanged);
}

function onStateChanged(user) {
    if (user) {
        var userProfile = { email: '', name: '', photoURL: '' };
        userProfile.email = firebase.auth().currentUser.email;
        userProfile.name = firebase.auth().currentUser.displayName;
        userProfile.photoURL = firebase.auth().currentUser.photoURL;

        var check = false;
        var datab = firebase.database().ref('users');
        datab.on('value', function (users) {
            users.forEach(function (data) {
                var user = data.val();
                if (user.email === userProfile.email) {
                    currentUserId = data.key;
                    check = true;
                }
            });
            if (check === false) {

                firebase.database().ref('users').push(userProfile, callback);
            }
            else {

                document.getElementById('profileImg').src = firebase.auth().currentUser.photoURL;
                document.getElementById('profileImg').title = firebase.auth().currentUser.displayName;
                document.getElementById('lnkLogin').style = 'display: none';
                document.getElementById('lnkLogout').style = '';
                document.getElementById('newChatBtn').style = '';


            }

            const messaging = firebase.messaging();
            messaging.requestPermission().then(function () {
                return messaging.getToken();
            }).then(function (token) {
                firebase.database().ref('fcmtoken').child(currentUserId).set({ token_id: token });
            });

            loadContacts();
            notifCount();
        });
    }
    else {
        document.getElementById('profileImg').src = 'Images/profile-blank.png';
        document.getElementById('profileImg').title = '';
        document.getElementById('lnkLogin').style = '';
        document.getElementById('lnkLogout').style = 'display: none';
        document.getElementById('newChatBtn').style = 'display: none';
    }
}

function callback(error) {
    if (error) {
        alert(error);
    }
    else {
        document.getElementById('profileImg').src = firebase.auth().currentUser.photoURL;
        document.getElementById('profileImg').title = firebase.auth().currentUser.displayName;
        document.getElementById('lnkLogin').style = 'display: none';
        document.getElementById('lnkLogout').style = '';
    }
}

function populateUsers() {
    var fList = document.getElementById('userList');
    fList.innerHTML = '<div> <span class="spinner-border text-primary mt-5" style="height: 8rem; width:4rem"> </span> </div>';

    var datab = firebase.database().ref('users');
    var databNotif = firebase.database().ref('friendRequests');
    var userList = '';
    datab.on('value', function (users) {
        if (users.hasChildren()) {
            userList = ' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';
            fList.innerHTML = '';
        }
        users.forEach(function (data) {
            var user = data.val();

            if (user.email !== firebase.auth().currentUser.email) {
                databNotif.orderByChild('sendTo').equalTo(data.key).on('value', function (notif) {
                    //let notiArray = Object.values(notif.val()).filter(n => n.status === 'Pending');
                    if (notif.numChildren() > 0 && Object.values(notif.val())[0].sendFrom === currentUserId) {
                        userList = '<li class="list-group-item list-group-item-action" ><div class="row"><div class="col-md-2"><img src="' + user.photoURL + '" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">' + user.name + '<button class="btn btn-sm btn-default" style="float: right;"  ><i class="fas fa-check"></i></button></div></div></div></li>';
                        fList.innerHTML += userList;
                    }
                    else {
                        userList = '<li class="list-group-item list-group-item-action" data-dismiss="modal" ><div class="row"><div class="col-md-2"><img src="' + user.photoURL + '" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">' + user.name + '<button class="btn btn-sm btn-primary" style="float: right;" onclick="sendRequest(\'' + data.key + '\')" ><i class="fas fa-plus"></i></button></div></div></div></li>';
                        fList.innerHTML += userList;
                    }
                });

            }
        });

    });
}

function sendRequest(key) {
    let notif = {
        sendTo: key,
        sendFrom: currentUserId,
        name: firebase.auth().currentUser.displayName,
        photo: firebase.auth().currentUser.photoURL,
        dateTime: new Date().toLocaleString(),
        status: 'Pending'
    };
    firebase.database().ref('friendRequests').push(notif, function (error) {
        if (error) alert(error);
        else {
            populateUsers();
        }
    });
}

function notifCount() {
    let datab = firebase.database().ref('friendRequests');
    datab.orderByChild('sendTo').equalTo(currentUserId).on('value', function (notif) {
        let notiArray = Object.values(notif.val()).filter(n => n.status === 'Pending');
        document.getElementById('notificationCount').innerHTML = notiArray.length;
    });
}

function populateNotifications() {
    var fList = document.getElementById('notifList');
    fList.innerHTML = '<div> <span class="spinner-border text-primary mt-5" style="height: 8rem; width:4rem"> </span> </div>';

    var datab = firebase.database().ref('friendRequests');
    var userList = '';
    datab.orderByChild('sendTo').equalTo(currentUserId).on('value', function (notif) {
        if (notif.hasChildren()) {
            userList = ' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';

        }
        notif.forEach(function (data) {
            var notification = data.val();
            if(notification.status === 'Pending')
                userList += '<li class="list-group-item list-group-item-action"><div class="row"><div class="col-md-2"><img src="' + notification.photo + '" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">' + notification.name + ' <button class="btn btn-sm btn-success" style="float: right;" onclick="acceptRequest(\'' + data.key + '\')" ><i class="fas fa-plus"></i></button><button class="btn btn-sm btn-danger" style="float: right;" onclick="rejectRequest(\'' + data.key + '\')" ><i class="fas fa-times"></i></button></div></div></div></li>';
        });
        fList.innerHTML = userList;
    });
}

function acceptRequest(key) {
    // let db = firebase.database().ref('friendRequests').child(key).once('value', function (notif) {
    //     var obj = notif.val();
    //     obj.status = "Accept";
    //     firebase.database().ref('friendRequests').child(key).update(obj, function (error) {
    //         if (error) alert(error);
    //         else {
    //             populateNotifications();
    //             var friend = { friendId: obj.sendFrom, userId: currentUserId };
    //             firebase.database().ref('friend_list').push(friend, function (error) {
    //                 if(error) alert(error);
    //                 else{

    //                 }
    //             });
    //         }
    //     });
    // });
    let db = firebase.database().ref('friendRequests').child(key).once('value', function (noti) {
        var obj = noti.val();
        obj.status = 'Accept';
        firebase.database().ref('friendRequests').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                // do something
                populateNotifications();
                var friendList = { friendId: obj.sendFrom, userId: obj.sendTo };
                firebase.database().ref('friend_list').push(friendList, function (error) {
                    if (error) alert(error);
                    else {
                        //do Something
                    }
                });
            }
        });
    });
}

function rejectRequest(key) {
    let db = firebase.database().ref('friendRequests').child(key).once('value', function (notif) {
        let obj = notif.val();
        obj.status = "Reject";
        firebase.database().ref('friendRequests').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                populateNotifications();
            }
        });
    });

}

function populateFriends() {
    // var fList = document.getElementById('friendList');
    // fList.innerHTML = '<div> <span class="spinner-border text-primary mt-5" style="height: 8rem; width:4rem"> </span> </div>';

    // var datab = firebase.database().ref('users');
    // var userList = '';
    // datab.on('value', function (users) {
    //     if (users.hasChildren()) {
    //         userList = ' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';

    //     }
    //     users.forEach(function (data) {
    //         var user = data.val();
    //         if (user.email !== firebase.auth().currentUser.email)
    //             userList += '<li class="list-group-item list-group-item-action" data-dismiss="modal" onclick="openChat(\'' + data.key + '\',\'' + user.name + '\',\'' + user.photoURL + '\')"><div class="row"><div class="col-md-2"><img src="' + user.photoURL + '" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">' + user.name + '</div></div></div></li>';
    //     });
    //     fList.innerHTML = userList;
    // });
}

function displaySendButton(context) {

    if (context.value === '' && flag === false) {
        document.getElementById('planeMic').classList.toggle('morphed');
        document.getElementById('mic').removeAttribute('style');
        document.getElementById('send').setAttribute('style', 'display: none');
        flag = true;
    }
    else if (context.value.length > 0 && flag === true) {
        flag = false;
        document.getElementById('planeMic').classList.toggle('morphed');
        document.getElementById('send').removeAttribute('style');
        document.getElementById('mic').setAttribute('style', 'display: none');
    }
}

/////////////////////////////////
//Voice record and send

let chunks = [];
let recorder;
var timeout;
function recordVoice(context) {
    let device = navigator.mediaDevices.getUserMedia({ audio: true });

    device.then(stream => {


        if (recorder === undefined) {
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                chunks.push(e.data);
                console.log("recording..");
                if (recorder.state === 'inactive') {
                    let blob = new Blob(chunks, { type: 'audio/webm' });
                    var fileReader = new FileReader();
                    fileReader.addEventListener("load", function () {
                        var newChatMsg = { senderId: currentUserId, msg: fileReader.result, msgType: 'audio', date: new Date().toLocaleString() };
                        firebase.database().ref('messages').child(chatSessionKey).push(newChatMsg, function (error) {
                            if (error) alert(error);
                            else {
                                var messageBody = document.querySelector('#messageList');
                                messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
                            }
                        });
                    }, false);
                    fileReader.readAsDataURL(blob);
                }
            }



        }

    });

    if (recorder !== undefined) {
        if (context.getAttribute('class').indexOf('stop') !== -1) {
            recorder.stop();
            context.setAttribute('class', 'fas fa-microphone fa-2x ic mic');
        }
        else {
            chunks = [];
            recorder.start();
            context.setAttribute('class', 'fas fa-stop fa-2x ic mic');
        }
    }
}

// function stopVoice(context) {
//     console.log("recording stopped");
//     recorder.stop();
//     clearInterval(timeout)
// }

onFirebaseStateChanged();