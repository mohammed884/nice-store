import React, { useEffect, } from 'react'
import '../../style/parts/category.css';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge } from '@fortawesome/free-solid-svg-icons';
import { getCategories } from '../../redux/actions/categories';
import Loading from '../main/loading';
export default function Category() {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getCategories());
    }, []);
    const reducer = (useSelector(state => state.categoriesReducer));
    if (reducer.loading) return (<Loading/>);
    const categories = reducer.categories
    return (
        <section className="category-section">
            <div className="category-header">
                <h1>Our Main Categories </h1>
                <FontAwesomeIcon icon={faThLarge} />
            </div>

            <div className="grid-items">
                {categories.map(({title , _id, image}) =>
                    <div key={_id} className="sizing-category">
                        <img src="/images/2b042c22-a5e6-4acf-806a-9ffe7dfd9b23-3Dprinter.jpg" alt={title} />
                        <span>{title}</span>
                    </div>
                )}
            </div>

        </section>
    )
}