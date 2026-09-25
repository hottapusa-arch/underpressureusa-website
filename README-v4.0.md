# Under Pressure USA field guide section update

This package updates the existing website at underpressureusa.us. It presents Water Pressure Fundamentals and Pipe & Fitting Fundamentals as the first two volumes of The Why Behind the Work field guide series. The store button opens https://underpressureusa.lemonsqueezy.com/ so future guides can be added to the store without changing the button.

## Install in the existing website repository

Replace `index.html` and `style.css` with the files in this package. Add `assets/images/pipe-and-fitting-fundamentals-cover.jpg`. The included Guide 1 cover may already be present. Keep all other existing site files, including `partner.html`, other assets, and any functions. Commit and push the changes to the existing GitHub repository; Cloudflare Pages will publish from that repository.

This removes the outdated printed-proof notice and the old direct checkout link. The site no longer hardcodes prices or formats; the store is the source for current availability.

## Check after publishing

Open the Field Guides navigation link on desktop and mobile. Confirm both covers show, the store button reaches the storefront, and the Underground and Why Behind the Work video sections still load.
