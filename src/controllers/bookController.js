const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const validator = require('../validators/validator')
const ReviewModel = require('../models/reviewModel')


const createBook = async (req, res) => {
    try {
        let requestBody = req.body;

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide book details' })
        }
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt} = requestBody

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Title must be present or check its key" })
        };
        //...................................................................................................
        if (typeof (req.body.title) != 'string') {

            return res.status(400).send({ status: false, message: "Numbers are not allowed" })
        }

        //......................................................................................................
        if (!validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "excerpt must be present, Please provide proper key and value" })
        };
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "userId must be present, Please provide proper key and value" })
        };
        if (!validator.isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "ISBN must be present, Please provide proper key and value" })
        };
        if (!validator.isValid(category)) {
            return res.status(400).send({ status: false, message: "category must be present, Please provide proper key and value" })
        };
        if (!validator.isValid(subcategory)) {
            return res.status(400).send({ status: false, message: "subcategory must be present, Please provide proper key and value" })
        };

        if (!validator.isValid(releasedAt)) {
            return res.status(400).send({ status: false, message: "Release date is required" })
        };
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `Invalid userId.` })
        }
        const titleAlreadyUsed = await bookModel.findOne({ title: title })
        if (titleAlreadyUsed) {
            return res.status(400).send({ status: false, message: "Title is already Present." })
        }
        const isbnAlreadyUsed = await bookModel.findOne({
            ISBN: ISBN
        });
        if (isbnAlreadyUsed) {
            return res.status(400).send({ status: false, message: "ISBN already used." })
        }
        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(400).send({ status: false, message: `User does not exists` })
        }
        if (req.body.userId != req.userId) {

            return res.status(403).send({
                status: false,
                message: "Unauthorized access."
            })
        }

        if (!/^(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)$/.test(releasedAt)) {

            return res.status(400).send({ status: false, message: `Invalid request parameter,date must be 'YYYY-MM-DD' in this form only` })
        }


        const bookdata = await bookModel.create(requestBody);
        return res.status(201).send({ status: true, message: "Success", data: bookdata })
    } catch (err) {
        return res.status(500).send({ status: false, message: "Something went wrong", Error: err.message })
    }
}
//....................................................................................................................

const getAllBooks = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false }
        const queryParams = req.query;

        if (validator.isValidRequestBody(queryParams)) {
            const { userId, category, subcategory } = queryParams;

            if (validator.isValid(userId) && validator.isValidObjectId(userId)) {
                filterQuery[ 'userId' ] = userId
            }

            if (validator.isValid(category)) {
                filterQuery[ 'category' ] = category.trim()
            }

            if (validator.isValid(subcategory)) {
                filterQuery[ 'subCategory' ] = subcategory.trim()
            }
        }

        const books = await bookModel.find(filterQuery).sort({ title: 1 }).select("_id title excerpt userId category subcategory releasedAt reviews")

        if (Array.isArray(books) && books.length === 0) {
            return res.status(404).send({ status: false, message: 'No Books found' })
        }

        return res.status(200).send({ status: true, message: 'Books list', data: books })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

//.......................................................................................................................
const getBookDetailsById = async (req, res) =>{
    try {
        const bookId = req.params.bookId.trim()
        if (!validator.isValid(bookId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid bookId' })
        }
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Inavlid bookId." })
        }

        const book = await bookModel.findOne({ _id: bookId, isDeleted: false }).select({ ISBN: 0, __v: 0 })
        if (!book) {
            return res.status(404).send({ status: false, message: 'No book found' })
        }

        const reviewsData = await ReviewModel.find({ bookId: bookId, isDeleted: false }).select({ deletedAt: 0, isDeleted: 0, updatedAt: 0, createdAt: 0, __v: 0 })
        const data = book.toObject()
        data['reviewsData'] = reviewsData
        return res.status(200).send({ status: true, message: 'Books list', data: data })
    } catch (error) {

        return res.status(500).send({ success: false, error: error.message });
    }
}

//.......................................................................................................................
const updateBook = async function (req, res) {
    try {
        const params = req.params.bookId
        const requestUpdateBody = req.body
        const { title, excerpt, releasedAt, ISBN } = requestUpdateBody;

        if (!validator.isValidObjectId(params)) {
            return res.status(400).send({ status: false, message: "Invalid bookId." })
        }

        if (!validator.isValidRequestBody(requestUpdateBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide book details to update.' })
        }



        if (title || excerpt || ISBN || releasedAt) {
            if (!validator.validString(title)) {
                return res.status(400).send({ status: false, message: "title is required or check its key & value" })
            }
            if (!validator.validString(excerpt)) {
                return res.status(400).send({ status: false, message: "excerpt is required or check its key & value." })
            };
            if (!validator.validString(ISBN)) {
                return res.status(400).send({ status: false, message: "ISBN is required or check its key & value" })
            };
            if (!validator.validString(releasedAt)) {
                return res.status(400).send({ status: false, message: "releasedAt is required or check its key & value." })
            };
        }

        if (!(title)) {

            return res.status(400).send({ status: false, message: 'title is required' })

        }

        if (!(excerpt)) {

            return res.status(400).send({ status: false, message: 'excerpt is required ' })

        }

        if (!(ISBN)) {

            return res.status(400).send({ status: false, message: 'ISBN is required ' })

        }

        if (!(releasedAt)) {

            return res.status(400).send({ status: false, message: 'releasedAt is required' })

        }

        const searchBook = await bookModel.findById({
            _id: params,
            isDeleted: false
        })
        if (!searchBook) {
            return res.status(404).send({ status: false, message: `Book does not exist by this ${params}.` })
        }

        if (searchBook.userId != req.userId) {
            return res.status(403).send({
                status: false,
                message: "Unauthorized access."
            })
        }

        const findTitle = await bookModel.findOne({ title: title, isDeleted: false })
        if (findTitle) {
            return res.status(400).send({ status: false, message: `${title.trim()} is already exists.Please try a new title.` })
        }
        const findIsbn = await bookModel.findOne({ ISBN: ISBN, isDeleted: false })
        if (findIsbn) {
            return res.status(400).send({ status: false, message: `${ISBN.trim()} is already registered.` })
        }
        if (searchBook.isDeleted == false) {
            const changeDetails = await bookModel.findOneAndUpdate({ _id: params }, { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN }, { new: true })

            res.status(200).send({ status: true, message: "Successfully updated book details.", data: changeDetails })
        } else {
            return res.status(400).send({ status: false, message: "Unable to update details.Book has been already deleted" })
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: "Something went wrong", Error: err.message })
    }
}

//.........................................................................................................
const deleteBookByID = async (req, res) => {
    try {
        const params = req.params.bookId;

        if (!validator.isValidObjectId(params)) {
            return res.status(400).send({ status: false, message: "Inavlid bookId." })
        }
        const findBook = await bookModel.findById({ _id: params })
        if (!findBook) {
            return res.status(404).send({ status: false, message: `No book found ` })
        } else if (findBook.userId != req.userId) {
            return res.status(403).send({
                status: false,
                message: "Unauthorized access."
            })
        } else if (findBook.isDeleted == true) {
            return res.status(400).send({ status: false, message: `Book has been already deleted.` })
        } else {
            const deleteData = await bookModel.findOneAndUpdate({ _id:params }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true });
            return res.status(200).send({ status: true, message: "Book deleted successfullly.", data: deleteData })
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: "Something went wrong", Error: err.message })
    }
}


module.exports = {
    createBook,
    getAllBooks,
    getBookDetailsById,
    updateBook,
    deleteBookByID

}
