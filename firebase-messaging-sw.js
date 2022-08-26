// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
var firebaseConfig = {
  apiKey: "AIzaSyAW1CqsoNQ3fYCCyEvoeTaecmaztuL6bXM",
  authDomain: "rapidchat-88f6b.firebaseapp.com",
  databaseURL: "https://rapidchat-88f6b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rapidchat-88f6b",
  storageBucket: "rapidchat-88f6b.appspot.com",
  messagingSenderId: "177002328605",
  appId: "1:177002328605:web:b2c2c92c1b5f3de0188cf4"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'You have new message';
  const notificationOptions = {
    body: payload.data.message,
    icon: payload.data.icon
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});