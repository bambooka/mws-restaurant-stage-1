let restaurant;
var map;

/**
 * Fetch restaurants as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            fillBreadcrumb();
        }
    });
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    if (self.restaurant) { // restaurant already fetched!
        self.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: self.restaurant.latlng,
            scrollwheel: false
        });
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map); // TODO: does it really do anything?
    }
};

/**
 * Show a map on button click
 */
document.getElementById('showMap').addEventListener('click', () => {
    // TODO: there should be a way to refer to the click source
    // event.fromElement.hide...
    document.getElementById('showMap').style.display = 'none';

    // TODO: consider hiding one of the elements (to also hide its children)
    document.getElementById('map-container').style.display = 'block';

    let script = document.createElement("script");

    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBgkQ0weVRwuYq0vm5BVvaNXAArbBahbKA&libraries=places&callback=initMap';
    script.type = 'text/javascript';

    document.getElementsByTagName('head')[0].appendChild(script);
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = DBHelper.imageSrcSetForRestaurant(restaurant);
    image.alt = DBHelper.imageAltForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    DBHelper.filterReviewsByRestaurantId(restaurant.id, (error, reviews) => {
        console.log(reviews);
        fillReviewsHTML(reviews);
    });

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');

    if(!navigator.onLine) {
        const connection_status = document.createElement('p');
        connection_status.classList('offline_label');
        connection_status.innerHTML('offline');
        li.classList.add('reviews_offline');
        li.appendChild(connection_status);
    }

    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

addReview = () => {
    event.preventDefault();
    let restaurantId = getParameterByName('id');
    let name = document.getElementById('reviewer-name').value;
    let rating;
    let comments = document.getElementById('text-review').value;
    rating = document.querySelector('#rating_score').value;
    const review = [name, rating, comments, restaurantId];


    const doneDataForReview = {
        restaurant_id: parseInt(review[3]),
        rating: parseInt(review[1]),
        name: review[0],
        comments: review[2].substring(0, 300),
        createdAt: new Date()
    };

    DBHelper.prepareReview(doneDataForReview);
    addReviewHTML(doneDataForReview);
    document.getElementById('review-form').reset();

};

addReviewHTML = (review) => {
    if (document.getElementById('no-review')) {
        document.getElementById('no-review').remove();
    }
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');

    //insert the new review on top
    ul.insertBefore(createReviewHTML(review), ul.firstChild);
    container.appendChild(ul);
};