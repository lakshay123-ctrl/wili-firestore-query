import * as firebase from 'firebase'
require('firebase/firestore')

const firebaseConfig = {
    apiKey: "AIzaSyCKTFVsiTnKdE6_WYuhUwFqzZH4pSdhaJw",
    authDomain: "wili-79465.firebaseapp.com",
    databaseURL:"https://wili-79465.firebaseio.com",
    projectId: "wili-79465",
    storageBucket: "wili-79465.appspot.com",
    messagingSenderId: "178959767166",
    appId: "1:178959767166:web:f4b7377f5bab517157aa2f"
  };
  
 firebase.initializeApp(firebaseConfig); 
  
  
export default firebase.firestore();

