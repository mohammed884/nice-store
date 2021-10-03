import React, { useState, useRef } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios'
import Footer from '../main/footer'
import '../../style/account/account.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faCogs, faFolderMinus, faShoppingCart, faSignOutAlt, faUserCircle, faShieldAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
export default function Account({ userReducer }) {
    const reducer = userReducer;
    const [errMsg, setErrMsg] = useState('')
    const [msg, setMsg] = useState('')
    const [password, setPassword] = useState('');
    const logoutMsgRef = useRef(null)
    const { isAdmin, name, email, phone, rank, score, address, governorate } = reducer.user;
    const handleLogout = async (e) => {
        e.preventDefault()
        const url = `${process.env.REACT_APP_SERVER_URL}/logout`;
        const res = await axios.post(url,
            { password },
            { withCredentials: true });
        console.log(res.data)
        if (!res.data.done) setErrMsg(res.data.errMsg)
        else (<Redirect to="/" />)
    }
    const handleDelete = async () => {
        const url = `${process.env.REACT_APP_SERVER_URL}/delete/user/email`;
        fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        setMsg('Check out Your Email')
    }
    return (
        <section className="account-section">
            <div className="max-account">
                <div className="flex-wrapper">

                    <div className="logout-msg" ref={logoutMsgRef}>
                        <header style={{ width: '80%', textAlign: 'right' }}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                style={{ color: 'tomato', cursor: 'pointer' }}
                                onClick={(e) => {
                                    logoutMsgRef.current.classList.remove('show-msg')
                                    logoutMsgRef.current.classList.add('hide-msg')
                                }} />
                        </header>
                        <form onSubmit={handleLogout}>
                            <label htmlFor="">
                                <span>Password</span>
                                <br />
                                <input type="text" onChange={(e) => setPassword(e.target.value)} />
                            </label>
                            <button type='submit'>Logout</button>
                        </form>
                    </div>
                    <div className="user-dashboard">
                        {msg && <span style={{ color: '#1e90ff' }}>{msg}</span>}
                        <h5>{name} <FontAwesomeIcon icon={faUserCircle} /></h5>
                        {
                            isAdmin
                            &&
                            <div>
                                <a href="/admin-panel">Admin Panel <FontAwesomeIcon icon={faShieldAlt} /></a>
                            </div>
                        }
                        <div>
                            <a href="/orders">Orders <FontAwesomeIcon icon={faBox} /></a>

                        </div>

                        <div>
                            <a href="/cart">Cart <FontAwesomeIcon icon={faShoppingCart} /></a>

                        </div>

                        <div>
                            <a href="/edit/account">Edit <FontAwesomeIcon icon={faCogs} /></a>
                        </div>

                        <div>
                            <button onClick={() => {
                                logoutMsgRef.current.classList.remove('hide-msg')
                                logoutMsgRef.current.classList.add('show-msg')
                            }}>Logout <FontAwesomeIcon icon={faSignOutAlt} /></button>
                        </div>

                        <div>
                            <button onClick={handleDelete}>Delete <FontAwesomeIcon icon={faFolderMinus} /></button>
                        </div>
                    </div>
                    <div className="user-info">
                        <div className="style-info">
                            <span>Name</span>
                            <p>{name}</p>
                        </div>
                        <div className="style-info">
                            <span>Email</span>
                            <p>{email}</p>
                        </div>
                        <div className="style-info">
                            <span>Governorate</span>
                            <p>{governorate}</p>
                        </div>
                        <div className="style-info">
                            <span>Address</span>
                            <p>{address}</p>
                        </div>
                        <div className="style-info">
                            <span>Phone</span>
                            <p>{phone}</p>
                        </div>
                        <div className="style-info">
                            <span>Score</span>
                            <p>{score}</p>
                        </div>
                        <div className="style-info">
                            <span>Rank</span>
                            <p style={{ color: rank.color }}>{rank.title}</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </section>
    )
}
