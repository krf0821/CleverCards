'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Dialog,
  DialogContent,
  CardContent,
  Paper,
  CardActionArea,
  DialogContentText,
  DialogTitle,
  DialogActions
} from '@mui/material';
import { doc, collection, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase'; // Assuming you have Firebase initialized in this file

export default function Generate() {
  const [text, setText] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null); // Ensure this is set with user info from authentication
  const [flipped, setFlipped] = useState([]);
  const router = useRouter();

  const handleSubmit = async () => {
    fetch('api/generate', {
      method: 'POST',
      body: text,
    })
      .then((res) => res.json())
      .then((data) => setFlashcards(data));
  };

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const saveFlashcards = async () => {
    if (!name) {
      alert('Please enter a name');
      return;
    }

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user?.id); // Ensure user ID is set correctly
    const docSnap = await getDoc(userDocRef);

    let userFlashcards = [];
    if (docSnap.exists()) {
      userFlashcards = docSnap.data().flashcards || [];
      if (userFlashcards.find((f) => f.name === name)) {
        alert('Flashcard collection with that name already exists');
        return;
      }
    }
    
    userFlashcards.push({ name });
    batch.set(userDocRef, { flashcards: userFlashcards }, { merge: true });

    const colRef = collection(userDocRef, name);
    flashcards.forEach((flashcard) => {
      const cardDocRef = doc(colRef);
      batch.set(cardDocRef, flashcard);
    });

    await batch.commit();
    handleClose();
    router.push('/flashcards');
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 4,
          mb: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ color: '#ffffff' }}>
          Generate Flashcards
        </Typography>
        <Paper sx={{ p: 4, width: '100%' }}>
          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            label="Enter Text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
          >
            Submit
          </Button>
        </Paper>
      </Box>

      {flashcards.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5">Flashcards Preview</Typography>
          <Grid container spacing={3}>
            {flashcards.map((flashcard, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <CardActionArea onClick={() => handleCardClick(index)}>
                  <CardContent>
                    <Box
                      sx={{
                        perspective: '1000px',
                        '& > div': {
                          transition: 'transform 0.6s',
                          transformStyle: 'preserve-3d',
                          position: 'relative',
                          width: '100%',
                          height: '200px',
                          boxShadow: '0 4px 8px 0 rgba(0,0,0, 0.2)',
                          transform: flipped[index]
                            ? 'rotateY(180deg)'
                            : 'rotateY(0deg)',
                        },
                        '& > div > div': {
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          backfaceVisibility: 'hidden',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 2,
                          boxSizing: 'border-box',
                        },
                        '& > div > div:nth-of-type(2)': {
                          transform: 'rotateY(180deg)',
                        },
                      }}
                    >
                      <div>
                        <div>
                          <Typography variant="h5" component="div">
                            {flashcard.front}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="h5" component="div">
                            {flashcard.back}
                          </Typography>
                        </div>
                      </div>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" color="secondary" onClick={handleOpen}>
              Save
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Save Flashcard Set</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a name for your flashcard set.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Set Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={saveFlashcards} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
