// Options
const CLIENT_ED =
  "118491998572-unjsa3gf5q93ci7fia4l3tnccq2s6ga0.apps.googleusercontent.com";
// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"
];
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";

const authorizeButton = document.getElementById("authorize-button");
const signoutButton = document.getElementById("signout-button");
const content = document.getElementById("content");
const channelForm = document.getElementById("channel-form");
const channelInput = document.getElementById("channel-input");
const videoContainer = document.getElementById("video-container");

const defaultChannel = "techguyweb";

// Form submit and change channel
channelForm.addEventListener("submit"),
  e => {
    e.preventDefault(); //so it doesn't actually submit

    const channel = channelInput.value;

    getChannel(channel);
  };

// Load auth2 library
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
  gapi.client
    .init({
      discoveryDocs: DISCOVERY_DOCS,
      clientID: CLIENT_ED,
      scope: SCOPES
    })
    .then(() => {
      // Listen for sign in state changes
      gapi.auth2
        .getAuthInstance()
        .isSignedIn.listen()
        .listen(updateSigninStatus);
      // Handle initial sign in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = "none";
    signoutButton.style.display = "block"; //block because we want to display the sign out button
    content.style.display = "block";
    videoContainer.style.display = "block";
    getChannel(defaultChannel);
  } else {
    authorizeButton.style.display = "block";
    signoutButton.style.display = "none"; //none because we DON'T want to display the sign out button
    content.style.display = "none";
    videoContainer.style.display = "none";
  }
}

// Handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

//Display channel data
function showChannelData(data) {
  const channelData = document.getElementById("channel-data");
  channelData.innerHTML = data;
}

// Get channel from API //The part before .then grabs the data and after the .then is the response
function getChannel(channel) {
  gapi.client.youtube.channels
    .list({
      part: "snippet,contentDetails,statistics", //These are what we're specifically asking for
      forUsername: channel
    })
    .then(response => {
      console.log(response);
      const channel = response.result.items[0];

      const output = `
      <ul class="collection">
        <li class="collection-item">Title: ${channel.snippet.title}</li>
        <li class="collection-item">ID: ${channel.id}</li>
        <li class="collection-item">Subscribers:: ${numberWithCommas(
          channel.statistics.subscriberCount
        )}</li>
        <li class="collection-item">Views:: ${numberWithCommas(
          channel.statistics.viewCount
        )}</li>
        <li class="collection-item">Videos:: ${numberWithCommas(
          channel.statistics.videoCount
        )}</li>
      </ul>
      <p>${channel.snippet.descrption}</p>
      <hr>
      <a class="btn grey darken-2" target="_blank" href="https://youtube.com/${
        channel.snippet.customUrl
      }>Visit Channel</a>
      `;
      showChannelData(output);

      const playlistId = channel.contentDetails.relatedPlayLists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert("No Channel By That Name"));
}

// Adding commas (courtesty of stackoverflow)
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Request video playlist function
function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId: playlistId,
    part: "snippet",
    maxResults: 10
  };

  const request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    const playListItems = response.result.items;

    if (playListItems) {
      let output = '<br><h4 class="center-align">Latest Videos</h4>';

      // Loop through videos and append output
      playListItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;

        output += `
      <div class="col s3">
      <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}"
      frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
      `;
      });

      // Output videos (OUTSIDE OF THE LOOP)
      videoContainer.innerHTML = output;
    } else {
      videoContainer.innerHTML = "No Uploaded Videos";
    }
  });
}
