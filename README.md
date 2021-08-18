# marieskogsen.github.io

## wishlist
- [ ] Bietellerdata representeres i én graf som viser flyt inn og ut
    - [ ] Klassifisering av flyt (lav, middels, høy, svært høy) representeres med figurer. 
    - [ ] Grafens størrelse og skop kan velges med en knapp. Valg av skop skal føre til et nærbilde av et mindre intervall enn 24 timer bak i tid.
- [ ] Lydtilstand representeres med ord og en figur. 
    - [ ] Alvorlige lydtilstander har varselfarger slik at de er lett å legge merke til. 
    - [ ] Lydtilstander er: Normal, sverming og hakkespett
- [ ] Sende melding til et DK for å resette det.  

## app.js

The app.js file contains functions that fetches data from nRFCloud every 5th second. Firstly, it iterates through the 100 last data points and plots temperature and humidity from Hive 1 and Hive 2, and the weight and bee counter of Hive 1. 
It uses the same way of getting data as nRFPizza, with cloud-api.js almost exactly the same, except for an added function that extraxts data more than 100 data points back in time. After receiving the data, it plots the different data types 
in each of the corresponding charts. We used google charts to draw them. Lastly, in app.js, we made a slider that changes regarding to what sound state the hives are in, with the states NORMAL, WOODPECKER and SWARMING. For testing, we used the value
of the temperature variable to decide which state it is. Also, the battery illustration of the Thingy:91 are shown as red, yellow or green based on the percentage left. The two other batteries, representing the battery of the two Thingy:52s are for now
grey as the data is not yet sent to the cloud. This can be change in the same way as the battery representation of the Thingy:91.

## cloud-api.js
This is mostly copied from nRF Pizza, exept for the addition of the function which supports fetching data from user defined interval. This was used to fetch more than 100 messages back in time. 
### Improvements
The function which was used to fetch older messages, can be used to fetch messages in time interval entered from a website interface. 

## private_keys_example.js
This file contains an representation on how our private_keys.js file looks. Switching out the name of the file and putting in the API Key from your nRF Cloud account and the device which messages are to be read from will make the website able to fetch messages from your nRF Cloud account. 

## index.html
The index.html file uses the row and column system from Bootstrap v4. 
