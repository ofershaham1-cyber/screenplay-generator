TODOS:
1. setup github actions:
1.1 add first e2e test 


to be run by github actions

1.2 



4. /generator - should generate a new screenplay.
- plan how to test it


4.1  modularity - allow to change between few responseFormats.json options:
4.1.1 allow to generate a screenplay and an audiobook. 
4.1.2 each of the formats should allow to edit the defaults for each field.

3. manage global state:
3.1   ongoing requests - persistent between routes



refreshing: http://localhost:5173/screenplay-result always shows error

"Default Speed (for all languages)"


==================
tts-play should stop in case of trying to play fresh/old screenplay.

fix darkmode.

clicking on the "play screenplay" button not working (should default to play from start)

live-label - what it is good for?

limit max tts-speed rate to 1.2

add option to change voice per language.

make code more modular, divide to more files based on functionalites.

dynamicly allow to update "TTS Content Options:"

---
ui:
some items are not visible:

i.e: clicking on the text:
- [+] Response Format Schema
- Expand All
- Collapse All
- the json itself shows: "[+] Object (2 keys)" and should expand when clicked
