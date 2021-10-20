//ROUTER SETUP
const express = require('express');
const router = express.Router();

//PACKAGES
const Product = require('../modules/products');
const User = require('../modules/user');
const uuid = require('uuid').v4;
const binaryId = require('../algos/binaryId');
const binaryName = require('../algos/binaryName');
const moment = require('moment');
const fs = require('fs');
const mergeLow = require('../algos/mergeLow');
const mergeHigh = require('../algos/mergeHigh');
const exportToken = require('./export_token');
const redis = require('redis');
const redisClinet = redis.createClient();
const getOrSetCach = require('../redis/getOrSetCache');
//GET ALL PRODUCTS
router.get('/products', async (req, res) => {
    try {
        const today = moment().format('l');
        const last12Months = moment().subtract(12, 'months').format('l');
        console.log(today, last12Months);
        console.log(await Product.find({ date: { $gte: last12Months, $lte: today } }));
        const checkRecently = req.cookies.checkRecently;
        if (checkRecently == 'false' || !checkRecently) {
            const todayDate = moment().format('l');
            await Product.updateMany({ date: todayDate }, {
                $set: {
                    "recently": false
                }
            });
            res.cookie('checkRecently', true, { maxAge: moment().add(1, 'day'), httpOnly: true, });
        }
        const sort = req.query.sort;
        if (sort === 'high') {
            const products = await getOrSetCach(`products?${sort}`, 3600, async () => {
                return mergeHigh(await Product.find({ active: true }).select('-userQty -checkBuyWithPoints'))
            })
            return res.send(products)

        }
        if (sort === 'low') {
            const products = await getOrSetCach(`products?${sort}`, 36000, async () => {
                return mergeLow(await Product.find({ active: true }).select('-userQty -checkBuyWithPoints'))
            });
            return res.send(products)
        }
        if (sort === 'discount') {
            const products = await getOrSetCach(`products?${sort}`, 36000, async () => {
                return await Product.find({ active: true, discount: true }).select('-userQty -checkBuyWithPoints')
            })
            return res.send(products)
        }
        else {
            const products = await getOrSetCach(`products`, 336000, async () => {
                return await Product.find({ active: true }).select('-userQty -checkBuyWithPoints')
            });
            return res.send(products)
        }
    } catch (err) {
        console.log(err)
    }
})

//GET PRODUCTS GRAPH
router.get('/graph/products', async (req, res) => {
    try {
        const userId = exportToken(req.cookies.token);
        const user = await User.findOne({ _id: userId });

        if (!user) return res.send({ done: false, errMsg: 'Login First' })
        if (!user.isAdmin) return res.send({ done: false, errMsg: 'Not Allowed To get this Data' });
        const requestedDate = req.query.date;
        
        if (requestedDate === 'lastMonth') {
            const lastMonth = moment().subtract(1, 'months').format('l');
            const products = await Product.find();
            return res.send({ done: true, products })
        }
        if (requestedDate === 'lastFiveMonths') {
            const lastFiveMonths = moment().subtract(5, 'months').format('l');
            const products = await Product.find({ date: { $gte: lastFiveMonths} });
            return res.send({ done: true, products })
        }
        if (requestedDate === 'LastTweleveMonths') {
            const lastTweleveMonths = moment().subtract(12, 'months').format('l');
            const products = await Product.find({ date: { $gte: lastTweleveMonths} });
            return res.send({ done: true, products })
        }
        else {
            res.send({ done: false, errMsg: 'This Date is not Allowed' })
        }
    } catch (err) {
        console.log(err);
    }
})
//GET SINGLE PRODUCTS
router.get('/product/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const product = await getOrSetCach(`product:${path}`, 3600, async () => {
            return await Product.findOne({ path })
        });
        if (!product) return res.send({ errMsg: 'No products with This path', done: false });
        const relatedProducts = await getOrSetCach(`relatedProducts?${product.category}`, 3600, async () => {
            return await Product.find({ category: product.category, path: { $ne: path }, active: true }).select('-userQty -checkBuyWithPoints')
        });
        res.send({ product, relatedProducts, done: true });
    } catch (err) {
        console.log(err)
    }
})

//SEARHC PRODUCTS 
router.get('/search', async (req, res) => {
    try {
        const title = req.query.title;
        let searchOptions = { active: true };
        if (title !== '') searchOptions.title = new RegExp(title, 'i');
        const products = await Product.find(searchOptions);
        res.send(products);
    } catch (err) {
        console.log(err)
    }
})

//ADD PRODUCT
router.post('/add/product', async (req, res) => {
    try {
        //CHECK ADMIN 
        const token = req.cookies.token;
        const userId = exportToken(token)
        const { isAdmin } = await User.findOne({ _id: userId })
        if (!isAdmin) return res.send({ errMsg: 'You Must Be Admin', done: false })

        //REGEX
        const alphabetRegEx = /^[A-Z]+$/i;

        //INFO
        const { title, category, price, qty, desc, shortDesc, score, addedScore, discountScorePercentage, discountScorePoints, discountScoreActive } = req.body;
        if (!req.files) return res.send({ errMsg: 'Please Full All Sections', done: false });
        const { image, sliderImages } = req.files
        const slider = [];
        const mimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];

        //CHECK DATA
        if (
            !title ||
            !category ||
            !price ||
            !qty ||
            !desc ||
            !image ||
            !sliderImages ||
            !shortDesc ||
            !addedScore ||
            !discountScorePercentage ||
            !discountScorePoints
        ) return res.send({ errMsg: 'Please Full All Sections', done: false });

        if (
            alphabetRegEx.test(price) ||
            alphabetRegEx.test(qty) ||
            alphabetRegEx.test(addedScore) ||
            alphabetRegEx.test(discountScorePercentage) ||
            alphabetRegEx.test(discountScorePoints)
        ) return res.send({ errMsg: 'Price, Score, Discount Score, Discount Percentage, Discount Points and Quantity Must Be a Number', done: false });

        if (
            Number(price) < 1 ||
            Number(qty) < 1 ||
            Number(addedScore) < 1 ||
            Number(discountScorePercentage) < 1 ||
            Number(discountScorePoints) < 1
        ) return res.send({ errMsg: 'Price, Score, Discount Score, Discount Percentage, Discount Points and Quantity Must Be a 1 or Higher', done: false });

        if (!mimeTypes.some(mime => mime !== image.mimetype)) return res.send({ errMsg: 'Include Valid Image', done: false });

        const path = title.replace(/ /g, '-')
        const imagePath = `${uuid()}-${image.name.replace(/ /g, '')}`;
        image.mv(`${__dirname}/../../client/public/images/${imagePath}`);

        if (sliderImages.length == undefined) {
            if (!mimeTypes.find(i => i == sliderImages.mimetype)) return res.send({ errMsg: 'Include Valid Image', done: false });
            const imagePath = `${uuid()}-${sliderImages.name.replace(/ /g, '')}`;
            sliderImages.mv(`${__dirname}/../../client/public/images/${imagePath}`);
            slider.push({ image: imagePath });
        }
        else if (sliderImages > 0) {
            for (let i = 0; i < sliderImages.length; i++) {
                const image = sliderImages[i];
                if (!mimeTypes.find(i => i == image.mimetype)) return res.send({ errMsg: 'Include Valid Image', done: false });
                const imagePath = `${uuid()}-${image.name.replace(/ /g, '')}`;
                image.mv(`${__dirname}/../../client/public/images/${imagePath}`);
                slider.push({ image: imagePath });
            };
        }
        await new Product({
            title,
            category,
            price,
            qty,
            desc,
            shortDesc,
            image: imagePath,
            slider,
            date: moment().add(7, 'days').format('l'),
            score,
            discountScoreActive,
            discountScore: { points: parseInt(discountScorePoints), percentage: parseInt(discountScorePercentage) },
            addedScore,
            path
        }).save();
        redisClinet.set('products', JSON.stringify(await Product.find({ active: true })));
        return res.send({ done: true })
    } catch (err) {
        console.log(err)
    }
});

//RATE PRODUCT
router.put('/rate/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const { value, } = req.body;
        const token = req.cookies.token;
        const userId = exportToken(token)
        const product = await Product.findOne({ _id: productId });
        if (!product) return res.send({ errMsg: 'No products with that given id', done: false });
        const { stars } = product
        const user = await User.findOne({ _id: userId });
        if (!user) return res.send({ done: false, errMsg: 'Please Login' })
        if (value > 5) return res.send({ done: false, errMsg: 'Stars Must be five or lower' })
        const check = binaryName(user.name, stars);
        if (!check) {
            await Product.updateOne({ _id: productId }, {
                $push: {
                    stars: {
                        name: user.name,
                        value: parseInt(value),
                    }
                }
            });
        }
        else {
            await Product.updateOne({ _id: productId, "stars.name": user.name }, {
                $set: {
                    "stars.$.value": parseInt(value)
                }
            })
        }
        redisClinet.set('products', JSON.stringify(await Product.find()));
        redisClinet.set(`product:${product.path}`, JSON.stringify(await Product.findOne({ _id: productId, active: true })));
        return res.send({ done: true })

    } catch (err) {
        console.log(err)
    }
})

//EDIT PRODUCT
router.put('/edit/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ _id: productId });
        if (!product) return res.send({ errMsg: 'No products with that given id', done: false });

        const { discountScore } = product
        const token = req.cookies.token;
        const userId = exportToken(token)
        const { isAdmin } = await User.findOne({ _id: userId });

        if (!isAdmin) return res.send({ errMsg: 'You Must Be Admin', done: false })

        let query = { $set: {} };

        for (let key in req.body) {
            if (product[key] != req.body[key]) query.$set[key] = req.body[key];
        }
        if (product.active != req.body.active) redisClinet.del(`product:${productId}`)
        if (product.title != req.body.title) {
            const { title } = req.body;
            const path = title.replace(/ /g, '-')
            query = {
                ...query,
                path
            }
        }
        if (discountScore.points != req.body.discountScorePoints) {
            query = {
                ...query,
                "discountScore": {
                    points: parseInt(req.body.discountScorePoints),
                    percentage: discountScore.percentage
                }
            }
        }
        if (discountScore.percentage != req.body.discountScorePercentage) {
            query = {
                ...query,
                "discountScore": {
                    points: parseInt(discountScore.points),
                    percentage: parseInt(req.body.discountScorePercentage),
                }
            }
        }
        if (req.files) {
            const { image, sliderImages } = req.files;
            if (image) {
                const imagePath = `${uuid()}-${image.name.replace(/ /g, '')}`;
                fs.unlink(`${__dirname}/../../client/public/images/${product.image}`, err => {
                    if (err) console.log(err)
                })
                image.mv(`${__dirname}/../../client/public/images/${imagePath}`);
                query = {
                    ...query,
                    image: imagePath,
                }
            };
            if (sliderImages) {
                const mimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];
                const images = [];
                if (sliderImages.length == undefined) {
                    if (!mimeTypes.find(i => i == sliderImages.mimetype)) return res.send({ errMsg: 'Include Valid Image', done: false });
                    const imagePath = `${uuid()}-${sliderImages.name.replace(/ /g, '')}`;
                    sliderImages.mv(`${__dirname}/../../client/public/images/${imagePath}`);
                    images.push({ image: imagePath });
                }
                else if (sliderImages > 0) {
                    for (let i = 0; i < sliderImages.length; i++) {
                        const image = sliderImages[i];
                        if (!mimeTypes.find(i => i == image.mimetype)) return res.send({ errMsg: 'Include Valid Image', done: false });
                        const imagePath = `${uuid()}-${image.name.replace(/ /g, '')}`;
                        image.mv(`${__dirname}/../../client/public/images/${imagePath}`);
                        images.push({ image: imagePath });
                    };
                }
                let slider = product.slider;
                slider = [...slider, ...images];
                query = {
                    ...query,
                    slider,
                };
            };
        };
        await Product.updateOne({ _id: productId }, query);
        redisClinet.set('products', JSON.stringify(await Product.find({ active: true })));
        redisClinet.set(`product:${product.path}`, JSON.stringify(await Product.findOne({ _id: productId, active: true })));
        res.send({ done: true })

    } catch (err) {
        console.log(err)
    }
});
router.put('/remove/slider/:id', async (req, res) => {
    try {
        const token = req.cookies.token;
        const userId = exportToken(token)
        const productId = req.params.id
        const { isAdmin } = await User.findOne({ _id: userId })
        if (!isAdmin) return res.send({ errMsg: 'You Must Be Admin', done: false })
        const product = await Product.findOne({ _id: productId })
        await Product.updateOne({ _id: productId }, {
            $set: {
                "slider": []
            }
        });
        redisClinet.set('products', JSON.stringify(await Product.find({ active: true })));
        redisClinet.set(`product:${product.path}`, JSON.stringify(await Product.findOne({ _id: productId, active: true })));
        res.send({ done: true })
    } catch (error) {
        console.log(error)
    }
})
//MAKE DISCOUNT
router.put('/discount/product/:id', async (req, res) => {
    const token = req.cookies.token;
    const userId = exportToken(token)
    const { isAdmin } = await User.findOne({ _id: userId })
    if (!isAdmin) return res.send({ errMsg: 'You Must Be Admin', done: false })

    const { discount } = req.body;
    if (!discount) return res.send({ errMsg: 'Please Full The Section', done: false });

    const productId = req.params.id;
    const { price, path } = await Product.findOne({ _id: productId });
    const discountPercentage = discount / 100;
    const finalPrice = price - (price * discountPercentage);

    await Product.updateOne({ _id: productId }, {
        $set: {
            "discount": true,
            "discountPrice": Math.floor(finalPrice),
            "discountPercentage": discount
        }
    });
    redisClinet.set('products', JSON.stringify(await Product.find({ active: true })));
    redisClinet.set(`product:${path}`, JSON.stringify(await Product.findOne({ _id: productId, active: true })));
    res.send({ done: true })
})

//CANCLE DISCOUNT 
router.put('/cancle/discount/:id', async (req, res) => {
    const token = req.cookies.token;
    const userId = exportToken(token)
    const { isAdmin } = await User.findOne({ _id: userId })
    if (!isAdmin) return res.send({ errMsg: 'You Must Be Admin', done: false })

    const productId = req.params.id;
    const product = await Product.find({ _id: productId });
    if (!product) return res.send({ errMsg: 'No products with that given id', done: false });
    const { discount } = product;
    if (!discount) res.send({ done: false, errMsg: 'Product Dont Contain Discount' })
    else {
        await Product.updateOne({ _id: productId }, {
            $set: {
                "discount": false
            }
        });
        redisClinet.set('products', JSON.stringify(await Product.find({ active: true })));
        redisClinet.set(`product:${productId}`, JSON.stringify(await Product.findOne({ _id: productId, active: true })));
        res.send({ done: true, })
    }
})
module.exports = router