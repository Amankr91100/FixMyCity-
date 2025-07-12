
const issueForm = document.querySelector('#issueForm');
const imageInput = document.querySelector('#imageUpload');
const imagePreview = document.querySelector('#imagePreview');
const userLocationInput = document.querySelector('#userlocation');
const getLocationBtn = document.querySelector('#getLocationBtn');
const nameInput = document.querySelector('#reporterName');
const issuesList = document.querySelector('#issuesList');
const popUp = document.querySelector('.popUp');
const okayBtn = document.querySelector('.popUp .btn-success');



document.getElementById("issueForm").addEventListener("submit", function(event) {
    const aadharInput = document.getElementById("Aadhar").value.trim();

    // Check if Aadhar number is exactly 12 digits
    const isValidAadhar = /^\d{12}$/.test(aadharInput);

    if (!isValidAadhar) {
        event.preventDefault(); // Stop form submission
        alert("Please enter a valid 12-digit Aadhar number.");
    }
});

// Load from localStorage
let issues = JSON.parse(localStorage.getItem("issues")) || [];
let issueIdCounter = parseInt(localStorage.getItem("issueIdCounter")) || 1;

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (file?.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;">`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = '<p>Please select a valid image file.</p>';
  }
});

// Get user address from coordinates using OpenCage API
const getUserCurrentAddress = async (latitude, longitude) => {
  const apiKey = '6011e9cf551a4e1c900752079f232fe8';
  const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    const { road, city, state, country } = data.results[0].components;
    userLocationInput.value = `${road || ''}, ${city}, ${state}, ${country}`;
  } catch (error) {
    console.error('Geocoding error:', error);
  }
};

// Get location on button click
getLocationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        userLocationInput.value = `Lat: ${latitude}, Long: ${longitude}`;
        getUserCurrentAddress(latitude, longitude);
      },
      () => {
        userLocationInput.value = 'Unable to fetch location';
      }
    );
  } else {
    userLocationInput.value = 'Geolocation not supported';
  }
});

// Handle form submit
issueForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const issueType = document.getElementById('issueType').value;
  const description = document.getElementById('Description').value;
  const location = userLocationInput.value;
  const name = nameInput.value;
  const imageFile = imageInput.files[0];

  const newIssue = {
    id: issueIdCounter++,
    type: issueType,
    description,
    location,
    reportedBy: name,
    date: new Date().toISOString(),
    image: '',
    votes: 0,
    userVotes: {}
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      newIssue.image = e.target.result;
      addIssue(newIssue);
    };
    reader.readAsDataURL(imageFile);
  } else {
    addIssue(newIssue);
  }
});

function addIssue(issue) {
  issues.unshift(issue);
  saveToLocalStorage();
  displayIssues();
  issueForm.reset();
  imagePreview.innerHTML = '';
  popUp.style.display = 'block';
}

// Display issues
function displayIssues() {
  issuesList.innerHTML = '';
  if (issues.length === 0) {
    issuesList.innerHTML = `<p class="text-center text-muted">No issues reported yet.</p>`;
    return;
  }

  issues.forEach(issue => {
    const card = document.createElement('div');
    card.className = 'card my-3 p-3';

    const imageHTML = issue.image ? `<img src="${issue.image}" class="imagetag">` : '';
    const badge = getPriorityBadge(issue.votes);

    
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="issue-type"><p>${issue.type} issue</p></div>
       ${badge}
      </div>
  ${imageHTML}
  <p><strong>📄 Description:</strong> ${issue.description}</p>
  <p><strong>📍 Location:</strong> ${issue.location}</p>
  <p><strong>👤 Reported By:</strong> ${issue.reportedBy}</p>
  
  <!-- Responsive Date and Vote Row -->
  <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
    <p class="mb-2 mb-md-0"><strong>🗓️ Date:</strong> ${new Date(issue.date).toLocaleString()}</p>
    
    <div class="voting-section d-flex justify-content-between align-items-center">
      <div class="vote-buttons me-2">
        <button class="btn btn-success me-2" onclick="vote(${issue.id}, 'up')">👍 Upvote</button>
        <button class="btn btn-danger" onclick="vote(${issue.id}, 'down')">👎 Downvote</button>
      </div>
      <span class="fw-bold ${getVoteCountClass(issue.votes)}">${issue.votes} </span>
    </div>
  </div>
`;

    issuesList.appendChild(card);
  });
}

// Voting logic
function vote(issueId, type) {
  const userId = getUserId();
  const issue = issues.find(i => i.id === issueId);
  if (!issue) return;

  const prevVote = issue.userVotes[userId];

  if (prevVote === type) {
    delete issue.userVotes[userId];
    issue.votes += (type === 'up' ? -1 : 1);
  } else if (prevVote) {
    issue.userVotes[userId] = type;
    issue.votes += (type === 'up' ? 2 : -2);
  } else {
    issue.userVotes[userId] = type;
    issue.votes += (type === 'up' ? 1 : -1);
  }

  saveToLocalStorage();
  displayIssues();
  showVoteFeedback(type);
}

function getUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

function saveToLocalStorage() {
  localStorage.setItem("issues", JSON.stringify(issues));
  localStorage.setItem("issueIdCounter", issueIdCounter.toString());
}

function showVoteFeedback(voteType) {
  const message = voteType === "up" ? "👍 Upvoted!" : "👎 Downvoted!";
  const feedback = document.createElement("div");
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${voteType === "up" ? "#28a745" : "#dc3545"};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: bold;
    z-index: 1000;
  `;
  feedback.textContent = message;
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 2000);
}

function getPriorityBadge(votes) {
  if (votes >= 50) return `<span class="badge bg-danger">High Priority</span>`;
  if (votes >= 20) return `<span class="badge bg-warning text-dark">Medium Priority</span>`;
  return `<span class="badge bg-secondary">Low Priority</span>`;
}

function getVoteCountClass(votes) {
  if (votes > 0) return 'text-success';
  if (votes < 0) return 'text-danger';
  return 'text-muted';
}

okayBtn.addEventListener('click', () => {
  popUp.style.display = 'none';
});


document.addEventListener('DOMContentLoaded', displayIssues);







