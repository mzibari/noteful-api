const express = require('express')
const FoldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()
const xss = require('xss')
const path = require('path')

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders)
            })
            .catch(next)
    })

foldersRouter.route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist` }
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })

    .get((req, res, next) => {
        res.json({
            id: res.folder.id,
            title: xss(res.folder.title),
        })
    })

    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

    .patch(jsonParser, (req, res, next) => {
        const { title } = req.body
        const folderToUpdate = { title }
        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'title'`
                }
            })
        }
        FolderService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter