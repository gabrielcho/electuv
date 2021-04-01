const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require('dotenv').config();
const models = require('./models');
const Op = models.Sequelize.Op;

const cookieSession = require('cookie-session');


const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20');
const { sequelize } = require('./models');



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    let [user, created] = await models.User.findOrCreate({where: {googleid: profile.id}, defaults:{name: profile.name.givenName , admin:false}});
    console.log(user);
    done(null, user);
  }
));


//cookie-session middleware
app.use(cookieSession({
    name:'electuv-session',
    keys: [process.env.KEY1, process.env.KEY2]
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());



//request body parsing
app.use(express.json());
app.use(express.urlencoded());


// Middleware used to check if the user has the correct auth cookies.
function checkAuth(req,res,next){
    if(req.isAuthenticated()){
    
        //req.isAuthenticated() will return true if user is logged in
        console.log(req.isAuthenticated());
        next();
    } else{
        console.log(req.isAuthenticated());
        res.redirect("/auth/google");
    }
}


/* example json
{
        coursecode: '710252M',
        coursename: 'ROBOTS ENTRE LA HISTORIA Y LA FICCIÓN',
        description: 'Este curso se encarga de explicar el desarrollo del paralelo entre los robots reales y ficticios.',
        rating: 100,
        faculty: 'Humanidades'
}
*/

async function  createCourse(jsoncourse){

    let createdCourse = 'invalid';
    if(await models.Course.findOne({where: {coursecode: jsoncourse.coursecode} })){
        return -1; //course already exists
    }
    await models.Course.create({
        coursecode: jsoncourse.coursecode,
        coursename: jsoncourse.coursename,
        description: jsoncourse.description,
        totalrating: 0,
        rating: 0,
        reviewcount: 0,
        faculty: jsoncourse.faculty
    })
    .then((course) => createdCourse = course)
    .catch((err) => console.log(err));

    return createdCourse;
}

/* 
{
    ### This is how it would look a JSON sent from the Client Side

    title: 'tremenda materia, me encantó',
    teacher: "Fuam fuam",
    period: '2021-1,
    content: 'El único profesor que se ha esforzado en enseñarme algo'

    The request agent has to be authenticated before any operation could occur

    //It needs a trycatch block in case it fails to asign the score
};
*/
async function postReview(jsonreview){
    let createdReview = 'invalid';
    if(jsonreview.rating > 5 || jsonreview.rating < 1){
        return reviewId;
    }
    
    await models.Review.create({
        userid: jsonreview.userid,
        rating: jsonreview.rating,
        anonymous: jsonreview.anonymous,
        courseid:jsonreview.courseid,
        author: jsonreview.author,
        title: jsonreview.title, 
        teacher: jsonreview.teacher,
        period: jsonreview.period,
        content: jsonreview.content,
        votes: 0
    })
    .then((review) => createdReview = review ? review.dataValues : -1) // -1 = this course does not exist
    .catch((err) => console.error(err) );
    let reviewCount, totalRating;
    await models.Course.findOne({where: {id: parseInt(jsonreview.courseid)}}).then((course) =>{
        reviewCount = course.reviewcount;
        totalRating = course.totalrating;
        console.log(reviewcount);
    }).catch(() => {return -1}); //The number of reviews
    try{
        await models.Course.update({rating:  sequelize.literal(`${(totalRating + jsonreview.rating)/(reviewCount + 1)}`),
            totalrating: sequelize.literal(`totalrating + ${jsonreview.rating}`), reviewcount: sequelize.literal('(reviewcount + 1)') }, {where: {id: jsonreview.courseid}});
    }
    catch{
        return -1;
    }
    
    return {...createdReview, author: jsonreview.anonymous ? 'Anónimo' : jsonreview.author};
}
 

// .destroy to delete rows
/*
    When we delete a review we must rollback the effects associated with course rating and review count on the respective course row
*/
async function deleteReview(review) {
    console.log(review);
    let rowsdeleted = 0;
    await models.Review.destroy({where: {id:review.id}})
    .then((result) =>  rowsdeleted = result)
    .catch((err) => console.error(err));
        let course = await models.Course.findOne({where: {id: review.courseid}});

        await models.Course.update({rating:  sequelize.literal(`(totalrating - ${review.rating}) * ${course.reviewcount - 1 === 0 ? 0 : 1/(course.reviewcount - 1 )}`),
        totalrating: sequelize.literal(`totalrating - ${review.rating}`), reviewcount: sequelize.literal('(reviewcount - 1)') }, {where: {id: review.courseid}}).then((a) =>{a}).catch((err) => {console.error(err)});
    
    return rowsdeleted;
}

async function getReviews(courseId) {
    let reviews = [];
    await models.Review.findAll({where: {courseid:courseId}})
    .then((reviewList) => reviews = reviewList)
    .catch((err) => console.error(err));

    return reviews;
}

// Passport serialize and deserializeuser functions

passport.serializeUser((user, done) => {
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA SERIALIZE ');
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {

    let user = await models.User.findByPk(id);
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA DESERIALIZE');

    done(null, user);
});



//Passport Google Oauth2.0 authentication route
app.get('/auth/google', passport.authenticate('google', {scope: 'profile'}), (req, res) => {
    
});


// Passport Google Oauth2.0 authentication callback route
app.get('/auth/google/callback/', passport.authenticate('google', { failureRedirect: '/authfallido' }), (req, res) => {
    res.redirect('/');
});

//root route ('homepage')
app.get('/', (req, res) => res.send(req.session));

/*

 ||||||THIS ENDPOINT IS NOW WORKING AS EXPECTED||||||


postcourse route //dev only
*/
app.post('/postcourse',checkAuth,  async(req, res) => {
    await models.User.findByPk(req.user.id)
    .then(async (user) => {
        if(user.admin){
            await createCourse(req.body)
            .then((course => {
                if(course == -1){
                    res.status(400).send('El curso ya existe');
                }
                else{
                    res.status(200).send(course);
                }
            }));
        }
        else{
            res.status(400).send('No tienes los permisos requeridos.');
        }
    });
})

/*

 ||||||THIS ENDPOINT IS NOW WORKING AS EXPECTED||||||

cursos route
sends all the courses available in a JSON list
*/
app.get('/cursos', async (req, res) => {
   //should set the response as a JSON list
    await models.Course.findAll()
        .then((courses) => res.status(200).send(courses))
        .catch((err) => res.status(400).send('error de comunicación con la base de datos'));
});



/*
Reviews route.

||||||THIS ENDPOINT IS NOW WORKING AS EXPECTED||||||

+ (DONE) Should return the reviews list of the corresponding course 
+ (DONE) Should inform by response if there is no course with the corresponding courseid
*/
app.get('/reviews/:courseid', async(req, res) => {
    let userId = req.user.id;
    let courseId = req.params.courseid; //route params course id
    let reviews = null;

     if (await models.Review.findAll({where: {courseid: courseId}})){ // if we find a course with the param id

        await getReviews(courseId)
        .then((reviewList) => reviews = reviewList)
        .catch((err) => console.log(err));

        reviews = await  Promise.all(reviews.map( (review) => { //we check for user votes for every Review
            //if we find a vote that has the user ID and the current review ID we will place its value
            let currentVote = 0
            models.Vote.findOne({ //Here we have to fetch the database to know if the user has voted on any of the reviews
                where: {userid: userId, reviewid: review.id}
            }).then((userVote) => {
                    currentVote = userVote ? userVote.vote : 0;
            }).catch(err => console.log(err));

            
            
            return {...review.dataValues,
                    vote: currentVote, 
                    author: review.dataValues.anonymous ?  'Anónimo' : review.dataValues.author} //returns current review item spreaded along the vote gotten by above function
        }));

        console.log('REVIEWS', reviews)
        res.status(200).send(reviews);
     }
    
    else{
        res.status(400).send('El curso al que intentas acceder no existe.')
    }

});

/* publicarreview Review route

 ||||||THIS ENDPOINT IS NOW WORKING AS EXPECTED||||||
 
 (Tested)

 + (DONE) Should include authenticate middleware
 + (DONE) Should not post the review if the user has already posted one
*/
app.post('/publicarreview', checkAuth, async (req, res) => {
    let userPk = req.user.id;
    let createdReview = null;
    if(await models.Course.findByPk(req.body.courseid)) {  //searches if the course does exist
        if (await models.Review.findOne({ //find one row where the user id is the same as the req.user.id
            where: {userid: userPk, courseid: req.body.courseid}
        })){
            res.status(400).send('Ya hiciste una review sobre este curso! Sólo una review por curso.'); 
        }         
        
        else {
            createdReview = await postReview({...req.body, userid: userPk, author: req.user.name, votes: 0} ); 
            console.log(createdReview);
            //Line from below needs to be refact
            res.status(200).send(createdReview);    
        }
    }

    else{
        res.status(400).send('Este curso no existe.'); 
    }
});

/*   eliminarreview route

 ||||||THIS ENDPOINT IS NOW WORKING AS EXPECTED||||||

should include authentication middleware
+ (DONE) It deletes a review from the database 
+ (DONE) If the review ID is not from the authenticated user, do NOT delete it 
*/
app.delete('/eliminarreview/:id', checkAuth, async(req,res) => {
    let reviewId = parseInt(req.params.id, 10);
    let userId = req.user.id;
    console.log("USERID: ", userId);

    //First it has to check if the review was created by the user
    models.Review.findOne({where: {[Op.or]: [{userid: userId}, req.user.admin], id: reviewId}})
    .then( (foundReview) => { 

        if(foundReview  ){ //if it finds a review created by the user or the user is an administrator, it will execute the delete operation
            deleteReview(foundReview.dataValues)
            .then( (rowsDeleted) => {
                if(rowsDeleted > 0){
                    res.status(200).send('Se eliminó la review de la base de datos');
                    models.Review.update({},{where: {id: reviewId}})
                }
                else{
                    res.status(406).send('La review que intentas eliminar ya no existe');
                }
            });
        }

        else{
            res.status(400).send('La review no existe o no es de tu autoría');
        }
    } )

});

/* votarreview route
    req.body {
        vote: 1 || -1,
        reviewid: integer
    }
*/
app.post('/votarreview', checkAuth, async(req, res) => {
    const reviewId = req.body.reviewid;
    const userId = req.user.id;
    const currentVote = parseInt(req.body.vote);
    // We check if the vote is valid

    if(currentVote !== 1 && currentVote !== -1){
        return res.status(400).send('Voto inválido');
    }

    // We check if the user has voted this specific review
    await models.Vote.findOne({where: {reviewid: reviewId, userid: userId}})
    .then(async (vote) => {
        if(vote){
            if(vote.vote === currentVote){ //if it votes the same score as the last time it reverts the vote to 0 (nonexistent)
                await vote.destroy()
                await models.Review.update({votes: sequelize.literal(`votes + ${-currentVote}`)},{where: {id: reviewId}});

            }
            else{
                vote.vote = currentVote;
                await vote.save();
                await models.Review.update({votes: sequelize.literal(`votes + ${2 * currentVote}`)},{where: {id: reviewId}});
            }
        }
        else{
            await models.Vote.create({
                reviewid: reviewId,
                userid: userId,
                vote: currentVote
            });
            await models.Review.update({votes: sequelize.literal(`votes + ${currentVote}`)},{where: {id: reviewId}});     
        }
    }).catch((err) => console.error(err));
    res.status(400).send('Voto actualizado');
});


/*     Auth routes
These routes are used to authenticate the user and let him use protected routes
*/ 
// app.get('/auth/google'); (DONE)
// app.get('/logout');
// app.get('/auth/google/callback'); (DONE)




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

