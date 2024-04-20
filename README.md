# Youtube Tool
This tool is created to help automate the process of uploading videos to Youtube.  
Currently it only supports uploading new videos.
 

## Parameters
#### --user "email@google.com"
The user used to log in to the channel that will be uploaded to.  
This is only required for the initial login, as a cookie will be saved locally after first login.  
If you have MFA enabled, a message will inform you to accept the login on your device.  
Note: A cookie will be saved per user.

#### --pass "password"
The password for the input user.

#### --channel "channelName" (optional and case sensitive)
In case the user has more than one channel, the name of the channel to receive the upload can be provided.

#### --path "AbsoluteFilePath"
The absolute path to the video that is being uploaded.

#### --title "Title" (optional)
The title for the video, if not provided the title will be the name of the file.

#### --description "Description" (optional)
The description of the video being uploaded.

#### --tags "FirstTag, SecondTag, ThirdTag" (optional)
Tags that should be applied to the video can be added in a comma separated string as shown below.  

#### --playlist "Playlist name" (optional)
The name a playlist to add the video to.  
Currently only supports a single playlist.  
*Note: If no playlist is found, a new will be created.*

#### --visibility "Private"
The initial visibility for the video. Default the value will be set to "Private".  
This support Private, Public and Unlisted.

#### --waitForVideoProcessing (optional)
If this option is set, the script will not complete before the video has been processed.  
Default, the video will be saved as soon as it has been uploaded, and the processing will happen in the background.

#### --disableHeadless (optional)
This will show the browser while the video is being uploaded. Typically used for debugging issues with uploads.

### Example
`node run index.js --user user@gmail.com --pass "password123" --tags "FirstTag, SecondTag" --playlist "The Playlist" --path "x:\videos\the_video.mp4" --title "The Video"`
