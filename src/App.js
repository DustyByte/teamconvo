import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, upload } from './lib/firebase';
import './App.css';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';


export default function App() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState('up');
  const [fieldText, setFieldText] = useState(``);
  const [messages, setMessages] = useState([]);
  const [avatar, setAvatar] = useState({
    file: null,
    url: ``
  })

  function handleAvatarSelect(e){
    setAvatar({
      file: e.target.files[0],
      url: URL.createObjectURL(e.target.files[0])
    })
  }

  async function handleSignUp(e){
    e.preventDefault();

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try{
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const avatarUrl = await upload(avatar.file);

      await setDoc(doc(db, `users`, res.user.uid), {
        avatar: avatarUrl,
        uid: res.user.uid,
        email: email,
        username: username
      })

      const userData = await getDoc(doc(db, `users`, res.user.uid));
      setUser(userData.data());      
    }catch(err){
      console.log(err);
    }
  }

  async function handleLogIn(e){
    e.preventDefault();
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try{
      await signInWithEmailAndPassword(auth, email, password );
    }catch(err){
      console.log(err.message);
    }
  }

  async function handleSignOut(){
    try{
      await signOut(auth);
    }catch(err){
      console.log(err);
    }
  }

  async function handleSend(e){
    e.preventDefault();
    try{
      const text = [...fieldText];
      setFieldText(``);
      await setDoc(doc(db, `chat`, `groupChat`), {
        chats: [...messages, {avatar: user.avatar, username: user.username, uid: user.uid, text: text}]
      });
      
    }catch(err){
      console.log(err);
    }
  }

  useEffect(() => {
    const unSub = onSnapshot(doc(db, `chat`, `groupChat`), doc => {
      const messageData = doc.data();
      setMessages(messageData.chats);
      if(user){
        const anchor = document.getElementById(`anchor`);
        setTimeout(() => anchor.scrollIntoView({behavior: `smooth`}), 70)
      }      
    })

    return () => unSub();
  }, [])
  
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      if(user){
        const userData = await getDoc(doc(db, `users`, user.uid));
        const fethcedMessages = await getDoc(doc(db, `chat`, `groupChat`));
        setUser(userData.data());
        setMessages(fethcedMessages.data().chats); 
        setTimeout(() => {
          const anchor = document.getElementById(`anchor`);
          anchor.scrollIntoView({behavior: `smooth`});
        }, 70) 
      }else{
        setUser(null);
        setMessages([]);
      }
    })

    return () => unSub();
  }, []);
  

  if(!user && authState === 'in') return (
    <div className='container noUser'>
      <h1>Log in</h1>
      <form onSubmit={e => handleLogIn(e)}>
        <input type='email' name='email' placeholder='Email'></input>
        <input type='password' name='password' placeholder='Password'></input>
        <button >Log in</button>
      </form>      
      <button className='textBtn' onClick={() => setAuthState('up')} >Sign up instead</button>
    </div>
  )

  else if(!user && authState === `up`) return (
    <div className='container noUser'>
      <h1>Sign up</h1>
      <form onSubmit={handleSignUp}>
        <label htmlFor='file'>
          <img src={avatar.url || '/avatar.png'} alt=''/>
          Choose an image
        </label>
        <input type='file' id='file' style={{display: `none`}} onChange={e => handleAvatarSelect(e)} ></input>
        <input type='username' name='username' placeholder='Username' ></input>
        <input type='email' name='email' placeholder='Email' ></input>
        <input type='password' name='password' placeholder='Password' ></input>
        <button>Sign up</button>
      </form>
      <button className='textBtn' onClick={() => setAuthState(`in`)}>Log in instead</button>
    </div>
  )

  return (
    <div className='container'>
      <div className='top'>
        <button onClick={() => handleSignOut()} >Log out</button>
      </div>

      <div className='center'>
        {messages.map(message => <div className={message.uid !== user.uid ? `message` : `message own`}>
            {message.uid !== user.uid && <img src={message.avatar} alt='' />}
            <div className='text'>
              {message.uid !== user.uid && <h5>{message.username}</h5>}
              <p>{message.text}</p>
            </div> 
          </div>
        )}
        <div id='anchor'></div>
      </div>

      <div className='bottom'>
        <form onSubmit={handleSend}>
          <input value={fieldText} onChange={e => setFieldText(e.target.value)} type='text' placeholder='Type a message...'></input>
          <button >Send</button>
        </form>
      </div>
    </div>
  );
}
