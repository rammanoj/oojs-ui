/**
 * Element that can be automatically clipped to visible boundaries.
 *
 * Whenever the element's natural height changes, you have to call
 * #clip to make sure it's still clipping correctly.
 *
 * @abstract
 * @class
 *
 * @constructor
 * @param {jQuery} $clippable Nodes to clip, assigned to #$clippable
 * @param {Object} [config] Configuration options
 */
OO.ui.ClippableElement = function OoUiClippableElement( $clippable, config ) {
	// Configuration initialization
	config = config || {};

	// Properties
	this.$clippable = $clippable;
	this.clipping = false;
	this.clipped = false;
	this.$clippableContainer = null;
	this.$clippableScroller = null;
	this.$clippableWindow = null;
	this.idealWidth = null;
	this.idealHeight = null;
	this.onClippableContainerScrollHandler = OO.ui.bind( this.clip, this );
	this.onClippableWindowResizeHandler = OO.ui.bind( this.clip, this );

	// Initialization
	this.$clippable.addClass( 'oo-ui-clippableElement-clippable' );
};

/* Methods */

/**
 * Set clipping.
 *
 * @param {boolean} value Enable clipping
 * @chainable
 */
OO.ui.ClippableElement.prototype.setClipping = function ( value ) {
	value = !!value;

	if ( this.clipping !== value ) {
		this.clipping = value;
		if ( this.clipping ) {
			this.$clippableContainer = this.$( this.getClosestScrollableElementContainer() );
			// If the clippable container is the body, we have to listen to scroll events and check
			// jQuery.scrollTop on the window because of browser inconsistencies
			this.$clippableScroller = this.$clippableContainer.is( 'body' ) ?
				this.$( OO.ui.Element.getWindow( this.$clippableContainer ) ) :
				this.$clippableContainer;
			this.$clippableScroller.on( 'scroll', this.onClippableContainerScrollHandler );
			this.$clippableWindow = this.$( this.getElementWindow() )
				.on( 'resize', this.onClippableWindowResizeHandler );
			// Initial clip after visible
			setTimeout( OO.ui.bind( this.clip, this ) );
		} else {
			this.$clippableContainer = null;
			this.$clippableScroller.off( 'scroll', this.onClippableContainerScrollHandler );
			this.$clippableScroller = null;
			this.$clippableWindow.off( 'resize', this.onClippableWindowResizeHandler );
			this.$clippableWindow = null;
		}
	}

	return this;
};

/**
 * Check if the element will be clipped to fit the visible area of the nearest scrollable container.
 *
 * @return {boolean} Element will be clipped to the visible area
 */
OO.ui.ClippableElement.prototype.isClipping = function () {
	return this.clipping;
};

/**
 * Check if the bottom or right of the element is being clipped by the nearest scrollable container.
 *
 * @return {boolean} Part of the element is being clipped
 */
OO.ui.ClippableElement.prototype.isClipped = function () {
	return this.clipped;
};

/**
 * Set the ideal size.
 *
 * @param {number|string} [width] Width as a number of pixels or CSS string with unit suffix
 * @param {number|string} [height] Height as a number of pixels or CSS string with unit suffix
 */
OO.ui.ClippableElement.prototype.setIdealSize = function ( width, height ) {
	this.idealWidth = width;
	this.idealHeight = height;
};

/**
 * Clip element to visible boundaries and allow scrolling when needed. Call this method when
 * the element's natural height changes.
 *
 * Element will be clipped the bottom or right of the element is within 10px of the edge of, or
 * overlapped by, the visible area of the nearest scrollable container.
 *
 * @chainable
 */
OO.ui.ClippableElement.prototype.clip = function () {
	if ( !this.clipping ) {
		// this.$clippableContainer and this.$clippableWindow are null, so the below will fail
		return this;
	}

	var buffer = 10,
		cOffset = this.$clippable.offset(),
		$container = this.$clippableContainer.is( 'body' ) ? this.$clippableWindow : this.$clippableContainer,
		ccOffset = $container.offset() || { top: 0, left: 0 },
		ccHeight = $container.innerHeight() - buffer,
		ccWidth = $container.innerWidth() - buffer,
		scrollTop = this.$clippableScroller.scrollTop(),
		scrollLeft = this.$clippableScroller.scrollLeft(),
		desiredWidth = ( ccOffset.left + scrollLeft + ccWidth ) - cOffset.left,
		desiredHeight = ( ccOffset.top + scrollTop + ccHeight ) - cOffset.top,
		naturalWidth = this.$clippable.prop( 'scrollWidth' ),
		naturalHeight = this.$clippable.prop( 'scrollHeight' ),
		clipWidth = desiredWidth < naturalWidth,
		clipHeight = desiredHeight < naturalHeight;

	if ( clipWidth ) {
		this.$clippable.css( { overflowX: 'auto', width: desiredWidth } );
	} else {
		this.$clippable.css( 'width', this.idealWidth || '' );
		this.$clippable.width(); // Force reflow for https://code.google.com/p/chromium/issues/detail?id=387290
		this.$clippable.css( 'overflowX', '' );
	}
	if ( clipHeight ) {
		this.$clippable.css( { overflowY: 'auto', height: desiredHeight } );
	} else {
		this.$clippable.css( 'height', this.idealHeight || '' );
		this.$clippable.height(); // Force reflow for https://code.google.com/p/chromium/issues/detail?id=387290
		this.$clippable.css( 'overflowY', '' );
	}

	this.clipped = clipWidth || clipHeight;

	return this;
};
