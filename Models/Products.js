const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
    new: {
        type: Boolean,
        required: false
    },
    popular: {
        type: Boolean,
        required: false
    }
})

productSchema.index({ title: 'text' });

const products = mongoose.model('products', productSchema);
module.exports = products;