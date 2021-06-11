<template>
  <b-container fluid="lg" class="about">
    <b-row>
      <b-col>
        <h1>About Spotify Agent</h1>
        <p>
          This app is meant to ease dance traning by switching song after fixed intervals.
        </p>
        <p>
          © Filip Lindqvist 2021
        </p>
      </b-col>
    </b-row>
    <b-row align-v="stretch" class="mt-2">
      <b-col>
        <b-card no-body class="overflow-hidden h-100" bg-variant="dark" text-variant="white">
          <b-row no-gutters>
            <b-col sm="5">
              <b-card-img src="/filiplindqvist.jpeg" alt="Image" class="rounded-circle p-4"></b-card-img>
            </b-col>
            <b-col>
              <b-card-body title="Filip Lindqvist">
                <b-card-text>
                  <p>I'm a freelance contractor helping companies with data/backend, fullstack and DevOps challanges.</p>
                  <p>My favorite tools of trade are Vue.JS, TypeScript, Java and Python.</p>
                  <b-button href="https://www.linkedin.com/in/filiplindqvist/" variant="primary" class="linkedin">
                    <b-icon-linkedin />
                    Contact on LinkedIn
                  </b-button>
                </b-card-text>
              </b-card-body>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
      <b-col>
        <b-card no-body class="overflow-hidden h-100" bg-variant="dark" text-variant="white">
          <b-row no-gutters>
            <b-col sm="5">
              <b-card-img src="/parkettochsvett.png" alt="Image" class="rounded-circle p-4"></b-card-img>
            </b-col>
            <b-col>
              <b-card-body title="ParkettOchSvett">
                <b-card-text>
                  <p>I'm also active on Instagram.</p>
                  <p>We are competing for <a href="https://www.nackswinget.se/">Dansklubben Nackswinget</a> in Nacka, Stockholm.</p>
                  <b-button href="https://www.instagram.com/parkettochsvett" variant="primary" class="instagram" size="lg">
                    <b-icon-instagram />
                    ParkettOchSvett
                  </b-button>
                </b-card-text>
              </b-card-body>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>

    <b-row>
      <b-col> </b-col>
    </b-row>
  </b-container>
</template>

<style lang="scss" scoped>
.linkedin {
  background: #0a66c2;
  border: 0;
}
.instagram {
  background: linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d);
  border: 0;
}
</style>
