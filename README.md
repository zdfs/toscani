Single-Field Credit Card Input
=======

This is a jQuery-based, progressively-enhanced solution for creating a [single-field credit card input](http://www.lukew.com/ff/entry.asp?1667). The idea is to create a more streamlined credit card entry process.

### August 6, 2015
This project, while an interesting experiement, was never meant for production, and yet the amount of love I got for this idea has been astounding. If anyone wants to take it over, I'm all ears. I haven't been able to work on this for years and the project, where I'm concerned, is dead. Thanks for all the interest. 

###September 2015
Happy to announce improvements and support are on its way, so please bear with us...

=======
###Instructions
- Add the **_app.js_** file to your scripts folder.
- Add the **_paymentInfo.css_** file to your stylesheets folder.

###Requirements
Add this files in your project, you can download them from the following links or you can find them under the libs folder.

- [Modernizr.js](http://modernizr.com/)
- [jQuery.js](https://jquery.com)
- [jQuery.inputmask.js](https://github.com/RobinHerbots/jquery.inputmask)
- [jQuery.inputmask.date.extensions.js](https://github.com/RobinHerbots/jquery.inputmask#usage)
- [Normalize.css](https://necolas.github.io/normalize.css/)

###Usage
Your credit card form should look like this:

    <form>
      <fieldset class="credit-card-group">
        <legend>Credit Card Information</legend>
        <label for="card-number">Credit Card Number</label>
        <input placeholder="1234 5678 9012 3456" pattern="[0-9]*" type="text" class="card-number" id="card-number">
        <label for="card-number">Expiration Date</label>
        <input placeholder="MM/YY" pattern="[0-9]*" type="text" class="card-expiration" id="card-expiration">
        <label for="card-number">CVV Number</label>
        <input placeholder="CVV" pattern="[0-9]*" type="text" class="card-cvv" id="card-cvv">
        <label for="card-number">Billing Zip Code</label>
        <input placeholder="ZIP" pattern="[0-9]*" type="text" class="card-zip" id="card-zip">
      </fieldset>
    </form>

###Demo
You can find a working demo [here](http://zdfs.github.io/toscani/paymentInfo/index.html).
