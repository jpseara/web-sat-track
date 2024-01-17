# web-sat-track

_WebSatTrack - Satellite Tracker and Antenna Controller App for Google Chrome_

In the context of the MSc in Telecommunications and Computer Engineering, at ISCTE - Instituto Universitário de Lisboa.

By João Pedro Seara, supervised by teacher Francisco Cercas (PhD), 2016

Demo: https://www.youtube.com/watch?v=hR9Ac9vjQwk

Version history:

- 1.0 - Original version (Jul 2016)
- 1.1 - Improvements (Aug 2022)

__

**Launching in Google Chrome**

1. In Google Chrome, navigate to the page chrome://extensions
2. Enable "Developer mode"
3. Click on "Load unpacked"
4. Select the WebSatTrack folder which exists at the root of this project
5. Navigate to the page chrome://apps
6. Click on the WebSatTrack application

Another option is to compile and then drag and drop the .crx file into the chrome://extensions page.

__

**Compiling the .crx file (Chrome Extension File)**

Windows:
`"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --pack-extension=.\WebSatTrack`

MacOS:
`/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=./WebSatTrack`

Linux:
`/opt/google/chrome/chrome --pack-extension=./WebSatTrack`
