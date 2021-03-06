import '../../style/parts/home.css';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, } from '@fortawesome/free-solid-svg-icons';
import ProductList from './product_list';
export default function Discount({ products }) {
    const filterd = [];
    for (let i = 0; i < products.length; i++) {
        if (products[i].discount) filterd.push(products[i]);
    }
    const responsive = {
        superLargeDesktop: {
            // the naming can be any, depends on you.
            breakpoint: { max: 4000, min: 3000 },
            items: 4
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3,
            slidesToSlide: 3 // optional, default to 1.
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2,
            slidesToSlide: 2 // optional, default to 1.
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1,
            slidesToSlide: 1 // optional, default to 1.
        }
    };
    return (
        <section className="home-section">
            <div className='sections-header'>
                <h1>Discount Products</h1>
                <FontAwesomeIcon icon={faBoxOpen} style={{ marginLeft: '10px' }} />
            </div>
            {
                filterd.length > 0
                    ?
                    <Carousel responsive={responsive} autoPlay={true} autoPlaySpeed={2000} infinite={true} arrows={false}>
                        {filterd.map(product =>
                            <ProductList product={product} key={product._id}/>
                        )}
                    </Carousel >
                    :
                    <h3 style={{ color: '#f1f1f1', opacity: '.8' }}>Huge Discounts Soon</h3>
            }
        </section>
    )
}
