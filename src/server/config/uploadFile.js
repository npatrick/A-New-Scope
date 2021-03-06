const fs = require('fs');
const passportFile = require('./passportFile.js');
const upload = require('./multerPath.js');


module.exports = function(app, express, gfs, fsFile) {   // these params are are coming from server.js
  //--UPLOAD SONG
  app.post('/upload', passportFile.isLoggedIn, upload, (req, res) => {
    if (!req.files[0]) {
      res.redirect('/#/user');
    } else {
      let lowerSong;
      if (req.body.songName) {
        lowerSong = req.body.songName.toLowerCase();
      }
      var temp = req.files[0].originalname;
      const writestream = gfs.createWriteStream({
        filename: temp, //filename to store in mongodb
        metadata: {
          username: req.session.passport.user,  //username from session, store more specs in here
          songName: req.body.songName,
          lowerSong: lowerSong
        }
      });
      fs.createReadStream(`./uploadTemp/${temp}`).pipe(writestream);  // open a stream so we can start reading uploads
      writestream.on('close', file => {
        console.log(`${file.filename} written To DB`);
        // unlink() deletes a name from the filesystem and the space is made available for reuse
        fs.unlink(`./uploadTemp/${temp}`, (err) => {
          if (err) throw err;
          console.log(`./uploadTemp/${temp} was deleted`);
        });
        res.redirect('/#/user');
      });
    }
  });

  app.post('/importSong', (req, res) => {
    let lowerName, lowerSong;
    if (req.body.username) {
      lowerName = req.body.username.toLowerCase();
    }
    if (req.body.songName) {
      lowerSong = req.body.songName.toLowerCase();
    }
    fsFile.find({
      filename: req.body.filename,
      'metadata.username': lowerName,
      'metadata.lowerSong': lowerSong
    }).then(data => { //search db
      if (!data[0]) {
        console.log('file not in db');
        res.end();
      } else {
        const writestream = fs.createWriteStream(`./src/client/imports/${req.body.filename}`); //write to imports folder
        const readstream = gfs.createReadStream({ //read from mongodb
          filename: req.body.filename
          //search by user, search by animation HERE
        });
        readstream.pipe(writestream);
        writestream.on('close', () => {
          console.log(`${req.body.filename} written to imports`);
          res.end('success');
        });
      }
    }).catch(err => {
      throw err;
    });
  });

  app.get('/getUserCollection', passportFile.isLoggedIn, (req, res) => {
    fsFile.find({'metadata.username': req.session.passport.user})
      .then(data => {
        res.send(data);
      }).catch(err => {
        throw err;
      });
  });

  app.post('/updateSongName', passportFile.isLoggedIn, (req, res) => {
    let lowerSong, temp;
    if (req.body.songName) {
      lowerSong = req.body.songName.toLowerCase();
    }
    if (req.body.newName) {
      temp = req.body.newName;
    }
    gfs.files.update(
      {
        'metadata.lowerSong': lowerSong,
        'metadata.username': req.session.passport.user
      },
      { 
        $set: {
          'metadata.songName': temp,
          'metadata.lowerSong': temp.toLowerCase()
        }
      }
    ).then(() => {
      res.end();
    }).catch(err => {
      throw err;
    });
  });

/**
 * Please note that route only removes song metadata from the
 * database. The song itself is not deleted. To clear the 
 * song file itself from the database, you need to delete fs.chunks.
 */

  app.post('/removeSong', passportFile.isLoggedIn, (req, res) => {
    let query;
    if (req.body.songName) {
      query = req.body.songName.toLowerCase();
    }
    fsFile.remove({
      'metadata.username': req.session.passport.user,
      'metadata.lowerSong': query
    }).then(() => {
      res.end();
    }).catch(err => {
      throw err;
    });
  });

  app.post('/getPublicCollection', (req, res) => {
    let lowerName;
    if (req.body.username) {
      lowerName = req.body.username;
    }
    fsFile.find({
      'metadata.username': lowerName
    }).then(data => {
      res.send(data);
    }).catch(err => {
      throw err;
    });
  });
  
/**
 * Serve an object with song names and usernames that match
 * the query.
 */
  app.post('/search', (req, res) => {
    let query;
    if (req.body.query) {
      query = req.body.query.toLowerCase();
    }
    var temp = {};
    fsFile.find({
      'metadata.lowerSong': {'$regex': query}
    }).then(songdata => { //find songs
      temp.songs = songdata;
      fsFile.find({
        'metadata.username': {'$regex': query}
      }).then(userdata => { //find users
        temp.users = userdata.length > 0 ? query : null;
        res.send(temp);
      });
    }).catch(err => {
      throw err;
    });
  });
};