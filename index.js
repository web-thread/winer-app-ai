const embeddingUrl = 'https://wine-openai-worker1.alexpertsi.workers.dev/'
const matchesUrl = 'https://wine-supabase-worker.alexpertsi.workers.dev/'
const choicesUrl = 'https://wine-openai-worker2.alexpertsi.workers.dev/'

window.addEventListener('DOMContentLoaded', () => {

// Select DOM elements
const form = document.querySelector('form');
const input = document.querySelector('input');
const reply = document.querySelector('.reply');
const targetDiv = document.getElementById('product-list');
const body = document.querySelector('body');
const more = document.querySelector('.more');
const footer = document.querySelector('footer');

// Handle form submission
form.addEventListener('submit', function(e) {
  e.preventDefault();         // Prevent form from refreshing the page
  main(input.value);          // Run main logic with input
});

// Main logic function
async function main(input) {
  try {
    targetDiv.innerHTML=  "";
    reply.innerHTML=  "";
    body.classList.add('think');
    // Step 1: Create an embedding for the user input
    const embedding = await createEmbedding(input);

    // Step 2: Find matching wine content + related titles/URLs
    const { match, match_titles, match_urls } = await findNearestMatch(embedding);

    // Step 3: Get a friendly wine recommendation
    await getChatCompletion(match, input);

    // Step 4: Display clickable wine titles
    displayProductLinks(match_titles, match_urls);

  } catch (error) {
    console.error('Error in main function.', error.message);
    reply.innerHTML = "Sorry, something went wrong. Please try again.";
  }
}

// Creates a semantic embedding for the input text. Transform user input to embedding.
async function createEmbedding(input) {

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  }

  const response = await fetch(embeddingUrl, options)

  const embeddingResponse = await response.json();

  //console.log(embeddingResponse);

  if (!response.ok) {
    throw new Error(embeddingResponse.error)
  }
  return embeddingResponse;

}


// Calls Supabase function to find the most semantically similar wine entries
//Get the embedding from openai to search supabase embeddings and return the matches
async function findNearestMatch(embedding) {

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(embedding)
  }

  const response2 = await fetch(matchesUrl, options)

  const data = await response2.json()

  //console.log(data);

  if (!response2.ok) {
    throw new Error(data.error)
  }

  // Combine the wine content and collect titles + URLs
  const match = data.map(obj => obj.content).join('\n');
  const match_titles = data.map(obj => obj.product_title);
  const match_urls = data.map(obj => obj.product_url);

  return {
    match,
    match_titles,
    match_urls
  };
}

// Uses the wine context + user's question to create a response
const chatMessages = [{
  role: 'system',
  content: `You are a wine sommelier of winery full of oak barrels in Greece Naoussa, who loves recommending wines to people. You will be given two pieces of information - some context about wines and a question. Your main job is to formulate a short answer to the question using the provided context. At second paragraph provide a short wine story related to your previous answer. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.` 
}];

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}`
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chatMessages)
  }

  const response3 = await fetch(choicesUrl, options)

  const choices = await response3.json()

  //console.log(choices);

  if (!response3.ok) {
    throw new Error(choices.error)
  }

  chatMessages.push(choices[0].message); // Save assistant’s response
  reply.innerHTML = choices[0].message.content; // Show reply on screen
  body.classList.remove('think');
  input.value = ''; // Clear input field
  input.setAttribute('placeholder', 'Something else?');
}

// Adds wine titles as clickable links in a <ul> list
function displayProductLinks(titles, urls) {

  if(titles.length){
    const proListTitle = document.createElement('h2');
    const proListFoo = document.createElement('p');
    let oneOrMore;
  
    if(titles.length === 1){
      oneOrMore = 'wine'
    } else if(titles.length > 1){
      oneOrMore = 'wines'
    }
  
    proListTitle.textContent = `I recommend you the following ${oneOrMore}:`;
    proListFoo.textContent = `Click on ${oneOrMore} title to learn more...`;

    const proList = document.createElement('ul');

    for (let i = 0; i < titles.length; i++) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = urls[i];
      a.textContent = titles[i];
      a.target = '_blank'; // Open in new tab
      li.appendChild(a);
      proList.appendChild(li);
    }
    targetDiv.appendChild(proListTitle);
    targetDiv.appendChild(proList);
    targetDiv.appendChild(proListFoo);
  }
}

window.onscroll = function(event) {
  if (window.scrollY > (10)) {
    body.classList.add('scrolled');
  }else{
    body.classList.remove('scrolled');
  }
}; //  end window.onscroll

let tomore = () => {
  footer.scrollIntoView({
    behavior: "smooth"
});
}
more.addEventListener('click', tomore);

});