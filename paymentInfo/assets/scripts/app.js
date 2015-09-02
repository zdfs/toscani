// Payment Info Component
// Author: Zachary Forrest, modified by Brad Frost
// Requires: jQuery, Modernizer, jQuery.inputmask

(function ($) {

	"use strict";

	$.fn.paymentInfo = function (method) {

		// Global variables.
		var methods,
			helpers,
			events,
			ccDefinitions,
			opts,
			pluginName = "paymentInfo";

		// Events map for the matchNumbers() function.
		events = $.map(['change', 'blur', 'keyup', 'keypress', 'keydown'], function (v) {
			return v + '.' + pluginName;
		}).join(' ');

		// Credit card regex patterns.
		ccDefinitions = {
			'visa': /^4/,
			'mc': /^5[1-5]/,
			'amex': /^3(4|7)/,
			'disc': /^6011/
		};

		helpers = {

			// Determine if the number being give corresponds to a credit card
			// regex pattern. If it does, break the loop and return the credit card type.

			getCreditCardType: function (number) {

				var ccType;

				$.each(ccDefinitions, function (i, v) {

					if (v.test(number)) {
						ccType = i;
						return false;
					}

				});

				return ccType;

			},

			// Our matchNumbers function. Probably does more than it should.
			// Will revisit.

			matchNumbers: function (el) {

				// Check to see if the the credit card number stored in data(). If not,
				// grab the current value of the credit card field and then get the type
				// of the card.

				var cardNumber = el.data("ccNumber") || el.val(),
					ccType = helpers.getCreditCardType(cardNumber);

				// If the credit card field has a value and we know what type of card it is,
				// then add the appropriate class to the card image <span>. This will allow us
				// to see the correct card. If we don't know the type, then revert back to the
				// default image. If the credit card field doesn't have a value, then we revert
				// back to the default image and erase any credit card number we might have stored.

				if (el.val() !== "") {
					if (ccType !== "") {
						$("." + opts.cardImageClass)
							.addClass(ccType);
					} else {
						$("." + opts.cardImageClass)
							.removeClass()
							.addClass(opts.cardImageClass);
					}
				} else {
					$("." + opts.cardImageClass)
						.removeClass()
						.addClass(opts.cardImageClass)
						.data("ccNumber", "");
				}

				// Check the card type to see if it's an Amex. If it is, update the mask to reflect
				// the number groupings that Amex uses. Also update the CVV. Amex requires four digits
				// instead of three. We have to reinitialize the inputmask() plugin, especially useful
				// if the user is switching our the number they want to use more than once.

				if (ccType === "amex") {
					el.inputmask({ mask: "9999 999999 99999", oncomplete: helpers.creditCardComplete });
					$("." + opts.cardCvvClass).inputmask({ mask: "9999", oncomplete: helpers.cvvComplete });
				} else {
					el.inputmask({ mask: "9999 9999 9999 9999", oncomplete: helpers.creditCardComplete });
					$("." + opts.cardCvvClass).inputmask({ mask: "999", oncomplete: helpers.cvvComplete });
				}

				// If the credit card value ever becomes empty, make sure the corresponding expiration date,
				// CVV, and Zip Code values are also empty.

				if (el.val() === "") {
					$("." + opts.fieldsetClass)
						.find("input:gt(0)")
						.val("");
				}

				if (ccType !== undefined) {
					$(el)
						.parents("." + opts.fieldsetClass)
						.removeClass("invalid shake");

					$('.' + opts.cardInstructionClass).removeClass("invalid");
				}

			},

			creditCardComplete: function () {

				// We need to get the credit card field and the unmasked value of the field.
				var element = $("." + opts.cardNumberClass),
					uvalue = element.inputmask("unmaskedvalue"),
					ccType = helpers.getCreditCardType(uvalue);

				// Let's make sure the card is valid
				if (ccType === undefined) {
					$(element)
						.parents("." + opts.fieldsetClass)
						.addClass("invalid shake");
					
					// Update instruction class to reflect the error
					$('.' + opts.cardInstructionClass).addClass("invalid");

					// Update instruction message
					helpers.updateInstruction(opts.messageCardNumberError);

					return;
				}

				// Let's make sure the number entered checks against the Luhn Algorithm
				if (helpers.ccLuhnCheck(uvalue) === false) {
					$(element)
						.parents("." + opts.fieldsetClass)
						.addClass("invalid shake");
				
					// Update instruction class to reflect the error
					$('.' + opts.cardInstructionClass).addClass("invalid");
					
					// Update instruction message
					helpers.updateInstruction(opts.messageLuhnCheckError);
					
					return;
				}

				// Store the credit card value in data(). Replace the value with the last
				// four numbers of the card.

				element.bind("saveValues", function () {

					if ((ccType === "amex" && uvalue.length === 15) || (ccType !== "amex" && uvalue.length === 16)) {

						element
							.data("ccNumber", uvalue)
							.val(uvalue.substr(uvalue.length - 4, uvalue.length));

					}

				});

				// Once this function is fired, we need to add a "transitioning" class to credit
				// card element so that we can take advantage of our CSS animations.

				element.addClass("transitioning-out");

				// We have to set a timeout so that we give our animations time to finish. We have to
				// blur the element as well to fix a bug where our credit card field was losing its
				// value prematurely.

				setTimeout(function () {

					element.removeClass("transitioning-out");

					if (!Modernizr.touch) {

						element.bind("blur", function () {
							element.trigger("saveValues");
						}).blur();

					} else {
						element
							.trigger("saveValues")
							.blur(function () {
								element.trigger("saveValues");
							});
					}

					element.addClass("full");

				}, opts.animationWait);

				// Setting another timeout so that we can wait for CSS animations to finish.
				setTimeout(function () {

					// Expose the rest of the payment info fields now that the credit card
					// has been filled out.
					$("." + opts.fieldsetClass)
						.find("input:gt(0)")
						.removeClass("hide");

				}, opts.animationWait);

				// After the credit card field is initially filled out, bind a click event
				// that will allow us to edit the number again if we want to. We also bind
				// a focus event (for mobile) and a keydown event in case of shift + tab

				$(element)
					.unbind("blur focus click keydown keypress")
					.bind("focus click keydown", function (e) {
						if (e.type === "focus" || e.type === "click" || (e.shiftKey && e.keyCode === 9)) {
							helpers.beginCreditCard($(element));

							// Update instruction message
							helpers.updateInstruction(opts.messageEnterCardNumber);
						}
					});

				if (window.navigator.standalone || !Modernizr.touch) {
					// Focus on the credit card expiration input.
					$("." + opts.cardExpirationClass).focus().val($.trim($("." + opts.cardExpirationClass).val()));

					// Update instruction message
					helpers.updateInstruction(opts.messageExpiration);
				}

			},

			// This function is fired  when the credit card expiration field's mask has been
			// satisfied. We trigger an animation for CVV card, wait for it to finish, and then
			// focus on the CVV field.

			expirationComplete: function () {

				$("." + opts.cardImageClass).addClass("cvv2");

				$("." + opts.cardExpirationClass)
					.addClass("full")
					.unbind("keydown blur")
					.bind("keydown", function (e) {
						if (e.keyCode === 8 && $(this).val() === "") {
							$(this).removeClass("full");
							if (window.navigator.standalone || !Modernizr.touch) {
								$("." + opts.cardNumberClass).focus();

								// Update instruction message
								helpers.updateInstruction(opts.messageEnterCardNumber);
							}
						}
					});

				if (window.navigator.standalone || !Modernizr.touch) {
					setTimeout(function () {
						$("." + opts.cardCvvClass).focus();

						// Update instruction message
						helpers.updateInstruction(opts.messageCVV);
					}, 220);
				}

				// Update instruction message
				helpers.updateInstruction(opts.messageCVV);

			},

			// This function is fired when the mask for CVV field is satisfied. We animate
			// the credit card back from the CVV card image to the appropriate card type.
			// We wait for the animation to finish and then focus on the zip field.

			cvvComplete: function () {

				$("." + opts.cardImageClass).removeClass("cvv2");

				$("." + opts.cardCvvClass)
					.addClass("full")
					.unbind("keydown blur")
					.bind("keydown", function (e) {
						if (e.keyCode === 8 || e.keyCode === 9) {
							if ($(this).val() === "") {
								$(this).removeClass("full");
								if (window.navigator.standalone || !Modernizr.touch) {
									$("." + opts.cardExpirationClass).focus();

									// Update instruction message
									helpers.updateInstruction(opts.messageExpiration);
								}
							}
							$("." + opts.cardImageClass).removeClass("cvv2");
						}
					});

				if (window.navigator.standalone || !Modernizr.touch) {
					// Focus on the credit card expiration input.
					$("." + opts.cardZipClass).focus();

					// Update instruction message
					helpers.updateInstruction(opts.messageZip);
				}

				


			},

			zipComplete: function () {

				$("." + opts.cardZipClass)
					.addClass("full")
					.unbind("keydown blur")
					.bind("keydown", function (e) {
						if (e.keyCode === 8 && $(this).val() === "") {
							$(this).removeClass("full");
							if (window.navigator.standalone || !Modernizr.touch) {
								$("." + opts.cardCvvClass).focus();

								// Update instruction message
								helpers.updateInstruction(opts.messageCVV);
							}
						}
					})
					.inputmask({ mask: "99999" });

				$("." + opts.fieldsetClass)
					.addClass('valid');

				$("." + opts.cardInstructionClass)
					.addClass('valid');

				// Update instruction message with success message
				helpers.updateInstruction(opts.messageSuccess);

			},

			// This function allows us to edit the credit card number once it's been entered.
			beginCreditCard: function (element) {

				// Set the value of the field to the original card number and apply our
				// transition state.

				$(element)
					.val($(element).data("ccNumber"))
					.addClass("transitioning-in");

				// Wait for the animation to complete and then remove our classes.
				setTimeout(function () {
					element.removeClass("transitioning-in full");
				}, 150);

				// Attach a keypress handler that listens for the "enter" key. If the user
				// clicks enter, then fire off our creditCardComplete() event.

				$(element)
					.unbind("keypress blur")
					.bind("keypress blur", function (e) {

						// Is it the enter key?
						if (e.keyCode === 13 || e.type === "blur") {

							var uvalue = $(element).inputmask("unmaskedvalue"),
								ccType = helpers.getCreditCardType(uvalue);

							// Make sure the number length is valid
							if ((ccType === "amex" && uvalue.length === 15) || (ccType !== "amex" && uvalue.length === 16)) {
								helpers.creditCardComplete();
							}

						}

					})
					.unbind("focus click keydown");

				// Hide the extraneous inputs until the credit card is filled out again.
				$("." + opts.fieldsetClass)
					.find("input:gt(0)")
					.addClass("hide");

			},

			updateInstruction: function (message) {
				$('.card-instruction').html(message);
			},

			// This function returns true or false if
			/**
			 * Luhn algorithm in JavaScript: validate credit card number supplied as string of numbers
			 * @author ShirtlessKirk. Copyright (c) 2012.
			 * @license WTFPL (http://www.wtfpl.net/txt/copying)
			*/
			ccLuhnCheck: (function (arr) {
				return function (ccNum) {
					var
						len = ccNum.length,
						bit = 1,
						sum = 0,
						val;
						
					while (len) {
						val = parseInt(ccNum.charAt(--len), 10);
						sum += (bit ^= 1) ? arr[val] : val;
					}
					
					return sum && sum % 10 === 0;
				};
			}([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]))

		};

		methods = {

			init: function (options) {

				// Get a copy of our configuration options
				opts = $.extend({}, $.fn.paymentInfo.defaults, options);

				// Configure the jQuery.inputmask plugin
				$.extend($.inputmask.defaults, {
					placeholder: " ",
					showMaskOnHover: false,
					overrideFocus: true
				});

				// Loop through our fieldset, find our inputs and initialize them.
				return this.each(function () {

					$(this)
						.find("label")
							.addClass("hide")
						.end()
						.find("." + opts.cardNumberClass)
							.inputmask({ mask: "9999 9999 9999 9999" })
							.before("<span class='" + opts.cardImageClass + "'></span>")
						.end()
						.find("." + opts.cardExpirationClass)
							.inputmask({
								mask: "m/q",
								clearIncomplete: true,
								oncomplete: helpers.expirationComplete
							})
							.addClass("hide")
						.end()
						.find("." + opts.cardCvvClass)
							.inputmask({ mask: "999" })
							.addClass("hide")
							.focus(function () {
								$("." + opts.cardImageClass).addClass("cvv2");
							})
							.blur(function () {
								$("." + opts.cardImageClass).removeClass("cvv2");
							})
						.end()
						.find("." + opts.cardZipClass)
							.inputmask({
								mask: "99999",
								oncomplete: helpers.zipComplete
							})
							.addClass("hide")
						.end();

						if(opts.cardInstruction) {
							$(this).
								after("<span class='" + opts.cardInstructionClass + "'>"+ opts.messageEnterCardNumber + "</span>");
						}

						helpers.matchNumbers($(this).find("." + opts.cardNumberClass).eq(0));

				}).unbind('.' + pluginName).bind(events, function () {
					helpers.matchNumbers($(this).find("." + opts.cardNumberClass).eq(0));
				});
			},

			// Need to add this later.
			destroy: function () {
				return this.unbind('.' + pluginName);
			}

		};

		// Plugin methods API
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		if (typeof method === "object" || !method) {
			return methods.init.apply(this, arguments);
		}
		return $.error("Method does not exist in plugin");

	};

	// Plugin config options.
	$.fn.paymentInfo.defaults = {
		fieldsetClass: "credit-card-group",
		cardImageClass: "card-image",
		cardCvvClass: "card-cvv",
		cardExpirationClass: "card-expiration",
		cardZipClass: "card-zip",
		cardNumberClass: "card-number",
		cardInstruction : true,
		cardInstructionClass: "card-instruction",
		animationWait: 600,
		focusDelay: 200,
		messageEnterCardNumber : "Please enter your credit card number",
		messageCardNumberError : "Please enter a valid credit card number",
		messageLuhnCheckError : "Please double check your credit card number",
		messageExpiration : "Please enter your card's expiration month and year",
		messageExpirationError : "Please enter a valid month and year",
		messageCVV : "Please enter the three-digit CVV number found on the back of your card",
		messageCVVAmEx : "Please enter your four-digit CVV number on the front of your card",
		messageZip : "Please enter your billing zip code",
		messageSuccess : "Hooray! You've successfully filled out your credit card information."
	};

}(jQuery));

$(".credit-card-group").paymentInfo();