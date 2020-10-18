const earthRadius = 3958.8; // miles

// miles from site to user.
function milesFromSite(user, site) {
    const sitePhi = site.siteLat * Math.PI/180;
    const siteLam = site.siteLon * Math.PI/180;

    const userPhi = user.latitude * Math.PI/180;
    const userLam = user.longitude * Math.PI/180;

    const deltaPhi = (site.siteLat - user.latitude) * Math.PI/180;
    const deltaLam = (site.siteLon - user.longitude) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) ** 2 + Math.cos(sitePhi) * Math.cos(userPhi) * Math.sin(deltaLam/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = earthRadius * c;

    return d;
}

// azimuth from site to user.
function bearingFromSite(user, site) {
    const sitePhi = site.siteLat * Math.PI/180;
    const siteLam = site.siteLon * Math.PI/180;

    const userPhi = user.latitude * Math.PI/180;
    const userLam = user.longitude * Math.PI/180;

    const y = Math.sin(userLam - siteLam) * Math.cos(userPhi);
    const x = Math.cos(sitePhi) * Math.sin(userPhi) - Math.sin(sitePhi) * Math.cos(userPhi) * Math.cos(userLam-siteLam);
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180/Math.PI + 360) % 360;

    return Math.round(bearing);
}

// azimuth from user to site.
function bearingToSite(user, site) {
    const sitePhi = site.siteLat * Math.PI/180;
    const siteLam = site.siteLon * Math.PI/180;

    const userPhi = user.latitude * Math.PI/180;
    const userLam = user.longitude * Math.PI/180;

    const y = Math.sin(siteLam - userLam) * Math.cos(sitePhi);
    const x = Math.cos(userPhi) * Math.sin(sitePhi) - Math.sin(userPhi) * Math.cos(sitePhi) * Math.cos(siteLam-userLam);
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180/Math.PI + 360) % 360;

    return Math.round(bearing);
}

// round float to two decimal places
function roundTwo(f) {
    return Math.round(f * 100) / 100;
}

// set <li> color based on signal score
//   - <=1   green
//   - 1-2   green->yellow->red
//   - >=2   red
function setColor(site) {
    let red = Math.round(Math.min(Math.max(510 * site.score - 510, 0), 255));
    let green = Math.round(Math.min(Math.max(-510 * site.score + 1020, 0), 255));
    site.li.style = 'background-color: rgba(' + red.toString() + ',' + green.toString() + ',100, 0.8);';
}

// fast calculation for lower bound on distance based on one degree of lat/lon
// being ~69 miles.
function fastMinDistance(user, site) {
    let deltaLat = Math.abs(user.latitude - site.siteLat);
    let deltaLon = Math.abs(user.longitude - site.siteLon);
    return Math.max(deltaLat, deltaLon) * 69;
}

fetch('sites.json').then(function(response) {
    response.json().then(function(sites) {
        let run = function() {
            const resultsContainer = document.querySelector('#content');
            resultsContainer.classList.remove('loading');

            const ul = document.querySelector('ul#sites');
            const siteTemplate = ul.querySelector('li.site');
            ul.removeChild(siteTemplate);

            sites.forEach(function(site) {
                site.li = siteTemplate.cloneNode(true);
                site.li.querySelector('div.frequency').innerText = site.frequency.toString() + ' MHz';
                site.li.querySelector('div.city').innerText = site.city;
                site.li.querySelector('div.state').innerText = site.state;
                site.li.querySelector('div.latitude').innerText = site.siteLat.toString() + '\u00b0';
                site.li.querySelector('div.longitude').innerText = site.siteLon.toString() + '\u00b0';
                site.li.querySelector('div.fcclink a').href = 'https://transition.fcc.gov/fcc-bin/fmq?fileno=&state=&city=&freq=0.0&fre2=107.9&serv=&status=&facid=&asrn=&class=&list=0&NextTab=Results+to+Next+Page%2FTab&dist=&dlat2=&mlat2=&slat2=&NS=N&dlon2=&mlon2=&slon2=&EW=W&size=9&call=' + site.callsign;

                if (site.parentCallsign == null) {
                    site.li.querySelector('div.callsign').innerText = site.callsign;
                } else {
                    site.li.querySelector('div.callsign').innerText = site.parentCallsign + ' (via ' + site.callsign + ')';
                }

                site.li.addEventListener('click', function(event) {
                    sites.forEach(function(site) {
                        if (site.li === event.target.closest('li.site')) {
                            site.li.classList.toggle('expanded');
                        } else {
                            site.li.classList.remove('expanded');
                        }
                    });
                });
            });

            let update = function(position) {
                if (sites.updating) {
                    return;
                }
                resultsContainer.classList.remove('locreq');

                let updateStart = window.performance.now();
                sites.updating = true;

                sites.forEach(function(site) {
                    site.distance = fastMinDistance(position.coords, site);
                    site.score = 100;

                    // the furthest station range in our data is 62.65mi. Since
                    // we only show sites within 3x the documented range, skip
                    // calculating actual distance/bearing if station is >188mi
                    // away.
                    if (site.distance < 188) {
                        site.distance = milesFromSite(position.coords, site);
                        if (site.distance < 188) {
                            site.bearingFrom = bearingFromSite(position.coords, site);
                            site.bearingTo = bearingToSite(position.coords, site);
                            site.range = site.contour[site.bearingFrom - 1];
                            site.score = site.distance / site.range;

                            site.li.querySelector('div.distance').innerText = roundTwo(site.distance).toString() + ' mi';
                            site.li.querySelector('div.bearing').innerText = site.bearingTo.toString() + '\u00b0';
                            site.li.querySelector('div.range').innerText = site.range.toString() + ' mi';
                            setColor(site);
                        }
                    }
                    site.li.hidden = site.score > 3;
                });

                sites.sort(function (a, b) {
                    if (a.score == b.score) {
                        return 0;
                    }
                    return a.score > b.score ? 1 : -1;
                });

                sites.forEach(function(site) {
                    if (!site.li.hidden) {
                        ul.appendChild(site.li);
                    }
                });

                let updateFinish = window.performance.now();
                console.log('finished updating', updateFinish - updateStart, 'ms');
                sites.updating = false;
            }

            console.log('requesting location');
            navigator.geolocation.getCurrentPosition(update);
            navigator.geolocation.watchPosition(update);
        }

        if (document.readyState == 'complete') {
            run();
        } else {
            window.addEventListener('DOMContentLoaded', run);
        }
    }).catch(function(error) {
        console.log('error parsing sites.json', error);
    })
}).catch(function(error) {
    console.log('error fetching sites.json', error);
})