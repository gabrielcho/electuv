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
/*{
        where: {
                googleid: profile.id
            }}, {
        default: {
                name: profile.givenName, admin: false}
    }
*/



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
    let reviewId = 'invalid';
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
    .then((review) => reviewId = review ? review : -1) // -1 = this course does not exist
    .catch((err) => console.error(err) );
    let reviewCount;
    await models.Course.findOne({where: {id: parseInt(jsonreview.courseid)}}).then((course) =>{
        reviewCount = course.reviewcount;
        console.log(reviewcount);
    }).catch(() => {return -1}); //The number of reviews
    try{
        await models.Course.update({rating:  sequelize.literal(`(totalrating + ${jsonreview.rating})/${reviewCount + 1}`),
            totalrating: sequelize.literal(`totalrating + ${jsonreview.rating}`), reviewcount: sequelize.literal('(reviewcount + 1)') }, {where: {id: jsonreview.courseid}});
    }
    catch{
        return -1;
    }
    
    return reviewId;
}

// .destroy to delete rows
async function deleteReview(reviewId) {
    let rowsdeleted = 0;
    await models.Review.destroy({where: {id:reviewId}})
    .then((result) =>  rowsdeleted = result)
    .catch((err) => console.error(err));
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



//passport authentication routes
app.get('/auth/google', passport.authenticate('google', {scope: 'profile'}), (req, res) => {
    
});

app.get('/auth/google/callback/', passport.authenticate('google', { failureRedirect: '/authfallido' }), (req, res) => {
    res.redirect('/');
});

//root route ('homepage')
app.get('/', (req, res) => res.send(req.session));


//postcourse route //dev only
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

//cursos route
//sends all the courses available in a JSON list
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
        }))

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
    console.log(req.user.name);
    let userPk = req.user.id;
    let reviewId = null;
    if(await models.Course.findByPk(req.body.courseid)) {  //searches if the course does exist
        if (await models.Review.findOne({ //find one row where the user id is the same as the req.user.id
            where: {userid: userPk, courseid: req.body.courseid}
        })){
            res.status(400).send('Ya hiciste una review sobre este curso! Sólo una review por curso.'); 
        }         
        
        else {
            reviewId = await postReview({...req.body, userid: userPk, author: 'Anónimo', votes: 0} ); 
            console.log(reviewId);
            res.status(200).send(reviewId);   
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
    models.Review.findOne({where: {userid: userId, id: reviewId}})
    .then( (foundReview) => { 

        if(foundReview || req.user.admin){ //if it finds a review created by the user or the user is an administrator, it will execute the delete operation
            deleteReview(reviewId)
            .then( (rowsDeleted) => {
                rowsDeleted > 0 ? 
                res.status(200).send('Se eliminó la review de la base de datos') 
                : res.status(406).send('La review que intentas eliminar ya no existe')
            });
        }

        else{
            res.status(400).send('La review no existe o no es de tu autoría');
        }
    } )

});

/* votarreview route
    it checks if the user has already voted 
*/

/*     Auth routes
These routes are used to authenticate the user and let him use protected routes
*/ 
// app.get('/auth/google'); (DONE)
// app.get('/logout');
// app.get('/auth/google/callback'); (DONE)




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

