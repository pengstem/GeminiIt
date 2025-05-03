// Example using fetch API
const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
const model = 'gemini-pro'; // Or 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest' etc.
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const data = {
  "contents": [{
    "parts":[{
      "text": "Write a story about a magic backpack." // Your prompt text goes here
      }]
    }]
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
.then(response => response.json())
.then(result => {
  console.log('Success:', result);
  // Process the result, e.g., result.candidates[0].content.parts[0].text
})
.catch(error => {
  console.error('Error:', error);
});
