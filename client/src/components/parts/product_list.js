import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import ReactHtmlParser from 'react-html-parser';
import React from 'react'
import '../../style/parts/home.css';
import { Link } from 'react-router-dom';

export default function ProductList({ product }) {
    const { title, price, image, shortDesc, path, stars, discount, discountPrice, discountPercentage, qty } = product;
    return (
        <div className="sizing-product">
            <Link to={`/product/${path}`}>
                {
                    qty > 0
                        ?
                        discount
                        &&
                        <div className="product-label" style={{ background:'#dd0e1c'}}>%{discountPercentage}-</div>
                        :
                        <div className="product-label" style={{ background:'#f1c40f', width:'100px'}}>Out Of Stock</div>
                }
                <img src={`/images/${image}`} alt={title} loading="lazy" />
            </Link>
            <div style={{ width: '80%' }}>
                <div className="grid-info">
                    <Link to={`/product/${path}`} style={{ justifySelf: 'start', gridArea: 'a', textDecoration: 'none', color: '#f1f1f1', height: 'fit-content'}}>{title}</Link>
                    {
                        discount
                            ?
                            <div style={{ gridArea: 'b', justifySelf: 'center', }}>
                                <span>{discountPrice}$</span>
                                <div></div>
                                <span className="price-element">{price}$</span>
                                <span style={{ fontSize: '14px', marginLeft: '5px' }}>/ -{discountPercentage}%</span>
                            </div>
                            :
                            <p style={{ justifySelf: 'center', gridArea: 'b' }}>{price}$</p>
                    }

                    <div className="desc" style={{ gridArea: 'c' }}><p>{ReactHtmlParser(shortDesc)}</p></div>
                    <div style={{ gridArea: 'd' }}>
                        {[...Array(5)].map((star, index) => {
                            let totalStars = 0;
                            for (let i = 0; i < stars?.length; i++) {
                                totalStars += stars[i].value;
                            }
                            const rating = totalStars / stars?.length;
                            const rate = index + 1;
                            return (
                                <FontAwesomeIcon
                                    icon={faStar}
                                    style={{
                                        color: rate <= rating ? '#f1c40f' : '#95a5a6',
                                        justifySelf: 'start',
                                    }}
                                    key={rate} />
                            )
                        })}
                        <span style={{ marginLeft: '10px', }}>{stars?.length > 1 ? `${stars?.length} Review` : `${stars?.length} Review`}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
