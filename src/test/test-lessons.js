const fs = require('fs');
const _path = require('path');
const fm = require('front-matter');
const moment = require('moment');
var colors = require('colors');
const { POSSIBLE_STATUS } = require("../utils/variables")
const { walk, indexContent } = require('../utils/files')



let slugs = [];
const validateLessons = (report) => report.lessons.map((l) => {

    
    if(!l){
        console.log("Skipping: ", l);
        return false;
    } 
    const { content, fileName, originalSlug, path } = l;
    
    const { slug, title, date, tags, status, authors, subtitle, ...rest } = fm(content).attributes;
    
    if(fileName.indexOf('.es') > -1){

      if(!report.names.includes(originalSlug) && status!='draft') throw new Error(`Lesson ${fileName} (${status}) must have an english version ${originalSlug}`.red);
    } 
    
    if(!title) throw new Error('Missing lesson title'.red);
    
    if(rest.cover && rest.cover.indexOf("../") > -1) throw new Error('The cover attribute can only be used for remote images, if the image is local please use cover_local instead'.red);
    else if(rest.cover_local){
        if(rest.cover_local.indexOf("../") == -1) throw new Error('The cover_local attribute can only be used for local images, if the image is remote please use cover instead'.red);
        const _p = "../"+rest.cover_local.replace("../../","");
        if(!fs.existsSync(_path.join(__dirname, _p))) throw new Error(`This image from cover_local could not be found: ${_p}`.red);
    }
    
    if(!tags || !Array.isArray(tags) || tags.length == 0) throw new Error(`Lesson tags must be an array and have at least one tag`.red);
    if(authors && !Array.isArray(authors)) throw new Error(`Author property must be an array of strings (github usernames) of post authors`.red);
    if(status && !POSSIBLE_STATUS.includes(status)) throw new Error(`The lesson status must be one of ${POSSIBLE_STATUS.join(',')} but it is ${status}. \n ${path}`.red);
    if(!moment(date).isValid()) throw new Error(`Invalid lesson date: ${date}`.red);

    if(status=='published' || !status){
      if(!subtitle || subtitle == '' || subtitle.length < 50 || subtitle.length > 340) throw new Error(`The lesson must have a subtitle within 50 and 340 characters, ${subtitle.length} found`.red);
    }
    if(slug && slugs.includes(slug)) throw new Error(`Duplicated lesson slug: ${slug} in two or more lessons in: ${path}`.red);
    slugs.push(slug);
    
    return true;
});

walk('src/content', function(err, results) {
    if (err){
        console.log("Error scanning lesson files".red);
        process.exit(1);
    } 
    
    try{
        const result = validateLessons(indexContent(results));
        console.log("Success!! All files are valid".green);
        process.exit(0);
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
});
