const express = require('express');
const router = express.Router();
const multer = require('multer');
let Products = require('../models/product.model');

const { auth } = require("../middleware/auth");

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {

        cb(null, `${Date.now()}_${file.originalname}`)
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.jpg' || ext !== '.png') {
            return cb(res.status(400).end('only jpg, png are allowed'), false);
        }
        cb(null, true)
    }
})

var upload = multer({ storage: storage });


//=================================
//             Product
//=================================

router.post("/uploadImage", upload.single("file"), (req, res) => {
    return res.json({ success: true, image: res.req.file.path, fileName: res.req.file.filename })
    
});


router.post("/uploadProduct", (req, res) => {


    //save all the data we got from the client into the DB 
    const product = new Products(req.body)

    product.save() 
        
    return res.status(200).json({ success: true })

});

router.post("/getproduct", (req, res) => {

    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    
    
    let findArgs = {};
    let term = req.body.searchTerm;

    for (let key in req.body.filters) {

        if (req.body.filters[key].length > 0) {
            if (key === "Price") {
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                }
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    if(term){
        Products.find(findArgs)
            .find({ $text: { $search: term } })
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            .exec((err, product) => {
                if (err) return res.status(400).json({ success: false, err })
                return res.status(200).json({ success: true, product })
        })
    } else {
        Products.find(findArgs)
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, product) => {
            if (err) return res.status(400).json({ success: false, err })
            return res.status(200).json({ success: true, product })
    })
    }
});

router.get("/products_by_id", (req, res) => {
    let type = req.query.type
    let productIds = req.query.id

    if (type === "array") {
        let ids = req.query.id.split(',');
        productIds = [];
        productIds = ids.map(item => {
            return item
        })
    }



    //we need to find the product information that belong to product Id 
    Products.find({ '_id': { $in: productIds } })
        .exec((err, product) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send(product)
        })
});


module.exports = router;
