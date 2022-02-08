const mongoose = require('mongoose')
const validator = require('../validators/validator')
const booksModel = require('../models/bookModel')
const reviewModel = require('../models/reviewModel')


//-------------------------------Functions---------------------------------/


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//-----------------------------------------------------------------------------------------//


const addReview = async function (req, res) {
    try {
        let params = req.params
        let bookId = params.bookId

        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

        }
        if (!isValid(bookId)) {
            return res.status(400).send({ status: false, message: `${bookId} is not a valid Book id or not present ` })

        }

        let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: `Book not found` })
        }

        let requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Review Details" })

        }
        // Extract Params
        const { reviewedBy, rating, review } = requestBody


        if (!isValid(rating)) {
            return res.status(400).send({ status: false, message: " please provide rating" })
        }

        if (!(rating == 1 || rating == 2 || rating == 3 || rating == 4 || rating == 5)) {
            return res.status(400).send({ status: false, message: ' please provide rating between 1 to 5' })
        }

        let createReviewdata = {
            bookId: bookId,
            reviewedBy: reviewedBy,
            reviewedAt: Date.now(),
            rating: rating,
            review: review
        }
        let reviewdata = await reviewModel.create(createReviewdata)
        await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: 1 } })

        let newdata = await reviewModel.find(reviewdata).select({ deletedAt: 0, isDeleted: 0, updatedAt: 0, createdAt: 0, __v: 0 })

        res.status(201).send({ status: true, data: reviewdata })
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

//......................................................................................................................//

const updateReview = async function (req, res) {
    try {
        let reviewId = req.params.reviewId
        let bookId = req.params.bookId
        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide update details' })
        }
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Inavlid bookId." })
        }
        if (!validator.isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Inavlid reviewId." })
        }
        
        if (!isValid(req.body.review)) {
            return res.status(400).send({ status: false, message: ' Please provide review or check its key & value' })
        }
        
        if (!isValid(req.body.rating)) {
            return res.status(400).send({ status: false, message: ' Please provide rating or check its key & value' })
        }
        if (!(req.body.rating == 1 || req.body.rating == 2 || req.body.rating == 3 || req.body.rating == 4 || req.body.rating == 5)) {
            return res.status(400).send({ status: false, message: ' Please provide a valid rating between 1-5' })
        }
        if (!isValid(req.body.reviewedBy)) {
            return res.status(400).send({ status: false, message: ' Please provide reviewedBy or check its key & value ' })
        }

        if (typeof (req.body.reviewedBy) != 'string') {

            return res.status(400).send({ status: false, message: "Numbers are not allowed" })
        }
        let checkingbookId = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!checkingbookId) {
            return res.status(404).send({ status: false, message: `book does not exist` })
        }
        let checkingreviewId = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!checkingreviewId) {
            return res.status(404).send({ status: false, message: `review does not exists` })
        }
        let reviews = await reviewModel.findOneAndUpdate({ _id: reviewId }, { $set: { "review": req.body.review, "rating": req.body.rating, "reviewedBy": req.body.reviewedBy } }, { new: true })
        //...............................................................................................................

        let reviewsData = await reviewModel.find({ bookId })
        let newBook = checkingbookId.toObject()                 

        if (reviewsData) {
            newBook['reviewsData'] = reviewsData  
        }
        res.status(200).send({ status: true, data: newBook })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//.......................................................................
const deleteReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Inavlid bookId." })
        }
        if (!validator.isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Inavlid reviewId." })
        }


        let Review = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        let book = await booksModel.findOne({ _id: bookId, isDeleted: false })
        if (!(Review) || !(book)) {
            return res.status(404).send({ status: false, msg: 'No book or reviewId is found' })
        }
        let checking = await reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() })
        if (checking) {
            res.status(200).send({ status: true, msg: "Deleted successfully" })
            return await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: -1 } })
        } else {
            res.status(404).send({ status: false, msg: "Review does not exist" })
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = {
    addReview, updateReview, deleteReview
}