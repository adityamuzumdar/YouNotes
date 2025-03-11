require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { YoutubeTranscript } = require('youtube-transcript')
const OpenAI = require('openai')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyParser.json())


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
})

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

// Function to generate notes using OpenAI
async function generateNotes(transcript) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, well-structured notes from video transcripts. Format the notes with proper headings, bullet points, and highlight key concepts."
        },
        {
          role: "user",
          content: `Please create comprehensive notes from this video transcript: ${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('Error generating notes:', error)
    throw new Error('Failed to generate notes')
  }
}

app.post('/', async function (req, res) {
  try {
    // Validate request body
    if (!req.body || !req.body.url) {
      return res.status(400).json({ error: 'No URL provided' })
    }

    const url = req.body.url
    const videoId = extractVideoId(url)

    // Validate YouTube URL
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' })
    }

    // Get video transcript
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId)
    if (!transcriptArray || transcriptArray.length === 0) {
      return res.status(404).json({ error: 'No transcript found for this video' })
    }

    // Combine transcript text
    const fullTranscript = transcriptArray
      .map(item => item.text)
      .join(' ')

    // Generate notes using OpenAI
    const notes = await generateNotes(fullTranscript)

    res.json({ notes })

  } catch (error) {
    console.error('Error processing request:', error)
    res.status(500).json({ 
      error: 'Failed to process video',
      details: error.message 
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})