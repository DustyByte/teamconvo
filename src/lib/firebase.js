import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCuPYpu7tLYgVKtshjENXJgn_6XJ3VM0d8",
  authDomain: "grouptext-7f787.firebaseapp.com",
  projectId: "grouptext-7f787",
  storageBucket: "grouptext-7f787.appspot.com",
  messagingSenderId: "614246137442",
  appId: "1:614246137442:web:12794d190cedf54df7db3b",
  measurementId: "G-KT7DHGT5YM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore();
export const storage = getStorage(app);
export const auth = getAuth(app);



export async function upload(file){
  const date = new Date();
  const storageRef = ref(storage, `images/${date}.jpg`);  
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');            
      }, 
      (error) => {
        reject('Error occured while uploading file' + error.code);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl => {
          resolve(downloadUrl);
        });
      }
    )
  })
}

