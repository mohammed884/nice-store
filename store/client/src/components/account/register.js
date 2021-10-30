import React, { useState,} from 'react';
import { useHistory } from 'react-router-dom';
import axios from "axios";
import "../../style/pages/register.css"
import Loading from '../main/loading';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [address, setAddress] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [succMsg, setSuccMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        const url = `${process.env.REACT_APP_SERVER_URL}/register`;
        const data = {
            name,
            email,
            password,
            phone,
            governorate,
            address,
        }
        axios.post(url, data, { withCredentials: true })
            .then(res => {
                setLoading(false)
                if (!res.data.done) setErrMsg(res.data.errMsg)
            })
            .catch(err => console.log(err));

        axios.post(`${process.env.REACT_APP_SERVER_URL}/send/verfiy/email`, { email }, { withCredentials: true })
            .then(res => {
                if (res.data.done) {
                    setLoading(false)
                    setSuccMsg('Verify Link sended to your Email')
                }
                else {
                    setErrMsg(res.data.errMsg)
                }
            }).catch(err => console.log(err))
    };
    if (loading) return (<Loading/>)
    return (
        <section className="register-section">
            <form onSubmit={handleSubmit}>
                {errMsg ? <p style={{ color: '#e74c3c', fontSize:'large', fontWeight:'bold'}}>{errMsg}</p> : ''}
                {succMsg ? <p style={{ color: '#1E90FF', fontSize:'large',fontWeight:'bold'}}>{succMsg}</p> : ''}
                <label htmlFor="">
                    <span>Name</span>
                    <input type="text" onChange={(e) => setName(e.target.value)} />
                </label>

                <label htmlFor="">
                    <span>Email</span>
                    <input type="text" onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label htmlFor="">
                    <span>Governorate</span>
                    <select onChange={(e) => setGovernorate(e.target.value)}>
                        <option value="baghdad">Baghdad - بغداد</option>
                        <option value="erbil">Erbil - اربيل</option>
                    </select>
                </label>

                <label htmlFor="">
                    <span>Specifec Address</span>
                    <textarea onChange={e => setAddress(e.target.value)}></textarea>
                </label>

                <label htmlFor="">
                    <span>Password</span>
                    <input type="password" onChange={(e) => setPassword(e.target.value)} />
                </label>

                <label htmlFor="">
                    <span>Phone</span>
                    <input type="number" onChange={(e) => setPhone(e.target.value)} />
                </label>
                <div><button type="submit">Register</button> <a href="/login">Login</a></div>
            </form>
        </section>
    )
}