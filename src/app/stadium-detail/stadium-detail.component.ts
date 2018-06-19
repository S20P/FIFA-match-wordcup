import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { MatchService } from '../service/match.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
declare var jQuery: any;
declare var $: any;
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-stadium-detail',
  templateUrl: './stadium-detail.component.html',
  styleUrls: ['./stadium-detail.component.css']
})
export class StadiumDetailComponent implements OnInit {

  public showloader: boolean = false;
  private subscription: Subscription;
  private timer: Observable<any>;
  stadium_id;
  stadiumDetail_collecction;

  AllCompetitions = [];

  match_ground_details = [];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    public datepipe: DatePipe
  ) { }

  ngOnInit() {
    this.setTimer();


    this.route.paramMap.subscribe((params: ParamMap) => {
      let id = parseInt(params.get("id"));
      this.stadium_id = id;
    });

    this.getStadiumAll();
    this.GetAllCompetitions();
  }


  public getStadiumAll() {
    console.log("get Stadium record from json");
    this.stadiumDetail_collecction = [];

    // API for get AllStadium Record
    this.matchService.getStadiumAllFromJson().subscribe(data => {

      console.log("Stadium Record for json ", data['Places']);
      var result = data['Places'];
      if (result !== undefined) {
        for (let place of result) {
          if (place.id == this.stadium_id) {
            this.stadiumDetail_collecction.push(place);
          }
        }
      }
    });
    console.log("Stadium_Places", this.stadiumDetail_collecction);
    console.log("");
  }




  GetAllCompetitions() {
    this.match_ground_details = [];

    this.matchService.GetAllCompetitions().subscribe(data => {
      //console.log("GetAllCompetitions",data);
      this.AllCompetitions = data['data'];
      for (var i = 0; i < this.AllCompetitions.length; i++) {

        this.matchService.GetMatchesByCompetition_ById(this.AllCompetitions[i].id).subscribe(data => {
          console.log("GetMatchesByCompetition_ById", data);

          var result = data['data'];

          if (result !== undefined) {
            for (let item of result) {
              if (item.venue_id == this.stadium_id) {
                console.log("item is....", item);
                var myString = item['formatted_date'];
                var arr = myString.split('.');
                let day = arr[0];
                let month = arr[1];
                let year = arr[2];
                var fulldate = year + "-" + month + "-" + day;


                //Change UTC timezone to IST(Local)
                let timezone = fulldate + " " + item['time'];
                let match_time = calcTime(timezone, '+11');
                console.log("time ", match_time);

                this.matchService.GetStaticMatches().subscribe(data => {

                  console.log("Matches type ang g", data);
                  for (let i = 0; i < data['length']; i++) {

                    if (data[i].id == item.id && data[i].comp_id == item.comp_id) {


                      var flag__loal = "https://s3.ap-south-1.amazonaws.com/tuppleapps/fifa18images/teamsNew/" + item.localteam_id + ".png";
                      var flag_visit = "https://s3.ap-south-1.amazonaws.com/tuppleapps/fifa18images/teamsNew/" + item.visitorteam_id + ".png";


                      var localteam_image;
                      var visitorteam_image;

                      var Image_team1 = isUrlExists(flag__loal);

                      if (Image_team1 == false) {
                        console.log('Image does not exist');
                        localteam_image = "assets/img/avt_flag.jpg"
                      }
                      else {
                        console.log('Image Exists');
                        localteam_image = flag__loal;
                      }


                      var Image_team2 = isUrlExists(flag_visit);

                      if (Image_team2 == false) {
                        console.log('Image does not exist');
                        visitorteam_image = "assets/img/avt_flag.jpg"
                      }
                      else {
                        console.log('Image Exists');
                        visitorteam_image = flag_visit;
                      }





                      this.match_ground_details.push({
                        "comp_id": item.comp_id,
                        "et_score": item.et_score,
                        "formatted_date": item.formatted_date,
                        "ft_score": item.ft_score,
                        "ht_score": item.ht_score,
                        "localteam_id": item.localteam_id,
                        "localteam_name": item.localteam_name,
                        "localteam_score": item.localteam_score,
                        "localteam_image": localteam_image,
                        "penalty_local": item.penalty_local,
                        "penalty_visitor": item.penalty_visitor,
                        "season": item.season,
                        "status": item.status,
                        "time": match_time,
                        "venue": item.venue,
                        "venue_city": item.venue_city,
                        "venue_id": item.venue_id,
                        "visitorteam_id": item.visitorteam_id,
                        "visitorteam_name": item.visitorteam_name,
                        "visitorteam_score": item.visitorteam_score,
                        "visitorteam_image": visitorteam_image,
                        "week": item.week,
                        "_id": item._id,
                        "id": item.id,
                        "match_number": data[i].match_number,
                        "match_type": data[i].match_type
                      });

                    }
                  }
                });

              }
            }
          }
        });
      }
    });
    function calcTime(dateto, offset) {
      // create Date object for current location
      let d = new Date(dateto);
      let utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      let nd = new Date(utc + (3600000 * offset));
      return nd.toLocaleString();
    }
    function isUrlExists(image_url) {
      var Image_Exists = false;
      $.ajax(
        {
          async: false,
          url: image_url,
          success: function (data) {
            Image_Exists = true;
          },
          error: function (data) {
            Image_Exists = false;
          }
        });

      return Image_Exists;
    }
    console.log('Match for this Stadium', this.match_ground_details);
  }

  matchdetails(id, comp_id) {
    this.router.navigate(['/matches', id, { "comp_id": comp_id }]);
  }

  public setTimer() {

    // set showloader to true to show loading div on view
    this.showloader = true;

    this.timer = Observable.timer(3000); // 5000 millisecond means 5 seconds
    this.subscription = this.timer.subscribe(() => {
      // set showloader to false to hide loading div from view after 5 seconds
      this.showloader = false;
    });
  }
}
