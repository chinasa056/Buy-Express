const productModel = require("../models/products")
const categoryModel = require("../models/categories")
const userModel = require("../models/user")
const cloudinary = require("cloudinary")

exports.addProduct = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description, price, size, color } = req.body
        const file = req.files

        const product = await productModel.findOne({ name: name })
        if (product) {
            return res.status(400).json({
                message: "You have already added this product"
            })
        }

        const category = await categoryModel.findById(categoryId)
        if (!category) {
            return res.status(404).json({
                message: "Category Does Not Exist"
            })
        }

        const result = await cloudinary.uploader.upload(file.path);
        fs.unlinkSync(file.path)

        const newProduct = new productModel({
            name,
            description,
            price,
            size,
            color,
            categoryName: category.name,
            productImage: {
                imageUrl: result.secure_url,
                publicId: result.public_id
            }
        })

        category.productIds.push(newProduct._id)
        await newProduct.save()
        await category.save()

        res.status(201).json({
            message: "New Product Added",
            productDetails: newProduct
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        })

    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const allProducts = await productModel.find()

        res.status(200).json({
            message: "All Products",
            data: allProducts
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
};

exports.getOneProduct = async (req, res) => {
    try {
        const { productId } = req.params
        const product = await productModel.findById(productId)

        if (!product) {
            return res.status(404).json({
                message: "All products",
            })
        }

        res.status(200).json({
            message: "All Products",
            data: product
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {

        const { categoryId } = req.params;
        const category = await categoryModel.findById(categoryId)
        if (!category) {
            return res.status(404).json({
                message: "Category does not exist"
            })
        }
        const products = await productModel.find({ categoryId }).populate('productIds')

        res.status(200).json({
            message: "All products",
            data: products
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { categoryId } = req.params;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        };
        const category = await categoryModel.findById(categoryId)

        // Delete the associated image from Cloudinary
        if (product.productImage && product.productImage.publicId) {
            await cloudinary.uploader.destroy(product.productImage.publicId);
        }

        // Remove the product from the category's product list
        category.productIds.pop(product._id);
        await category.save()

        // Delete the product from the database
        await productModel.findByIdAndDelete(productId);

        return res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
