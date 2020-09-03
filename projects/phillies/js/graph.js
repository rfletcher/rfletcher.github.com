var current_year = (new Date()).getFullYear(),
    selected_year = 2011,
    graph, seasons;

function calcWinPct( seasons ) {
  return _.map( seasons, function( season ) {
    pct = season.wins / ( season.wins + season.losses );
    season.pct = "." + Math.floor( pct * 1000 );
    return season;
  } );
}

function getSortProperty() {
  switch( location.hash && location.hash.substr( 1 ).toLowerCase() ) {
    case "pct": return "pct";
    case "wins": return "wins";
    default: return "year";
  }
}

function showSummary() {
  var html, left = -1, pct, total, sort_prop = getSortProperty();
  if( sort_prop === "year" ) {
    html = "<strong>&nbsp;</strong>";
  } else {
    total = seasons.length
    _.detect( seasons, function( season ) { left++; return season.year === selected_year } );
    pct = Math.round(left/(total-1)*100);

    html =
      "The <strong>" + selected_year + " Phillies</strong> " + ( selected_year === current_year ? "have" : "had" ) + " " +
      ( sort_prop === "wins" ? "<strong>more wins</strong> " : "<strong>a better win percentage</strong> " ) +
      "than " +
      ( left === ( total - 1 ) ? "<strong>all " + ( total - 1 ) + "</strong> " :
        "<strong>" + left + "</strong> <span class=\"note\">(" + pct + "%)</span> of their " + ( total - 1 ) + " " ) +
      "other seasons";
  }

  $("#summary").html( html );
}

function sortByProperty( a, b, prop ) {
  var av = a[prop], bv = b[prop];
  if( av === bv ) {
     // do a secondary sort by year
    return sortByProperty( b, a, "year" );
  } else {
    return av - bv;
  }
}

function render() {
  var min_x, max_x, max_y, x_prop, x_values, first_render = ! Boolean(graph), labels = [], y_prop = "wins";

  if( ! first_render ) {
    graph.destroy();
  }

  x_prop = getSortProperty();

  seasons.sort( function( a, b ) { return sortByProperty( a, b, x_prop ); } );

  showSummary();
  selectSortLink();

  // gather the values
  x_values = _.map( seasons, function( season ) {
    var point, y = season[y_prop], x = season[x_prop];
    max_y = max_y ? Math.max( max_y, y ) : y;
    min_x = min_x ? Math.min( min_x, x ) : x;
    max_x = max_x ? Math.max( max_x, x ) : x;
    labels.push( season.year );
    point = {
      id: season.year,
      y: y
    };
    if( season.year === selected_year ) {
      point.color = "rgba(198,24,0,0.8)";
    };
    return point;
  } );



  graph = new Highcharts.Chart( {
    chart: {
      alignTicks: false,
      renderTo:   "graph",
      type:       "column"
    },
    credits: { enabled: false },
    plotOptions: { column: {
      animation:    first_render,
      borderRadius: 1,
      borderWidth:  0,
      color:        "rgba(0,0,0,0.15)",
      groupPadding: 0,
      pointPadding: 0.1,
      shadow:       false,
      states: {
        hover: {
          brightness: 0.5
        }
      }
    } },
    legend: { enabled: false },
    series: [{
      data: x_values
    }],
    title: null,
    tooltip: {
      formatter: function() {
        var label, stats,
            year = this.x,
            season = _.detect( seasons, function( s ) { return s.year === year } );

            stats = {
              year:   season.year,
              wins:   season.wins + " wins",
              losses: season.losses + " losses",
              pct:    season.pct + " pct"
            };

        if( x_prop !== "year" ) {
          stats[x_prop] = "<span style=\"font-weight: bold\">" + stats[x_prop] + "</span>";
        }

        if( year === current_year && ( season.wins + season.losses < 162 ) ) {
          stats.year += "*";
        }

        label = "<span style=\"color:rgba(198,24,0,0.8); font-weight: bold; font-size: 13px;\">" + stats.year + "</span><br/>" +
          stats.wins + "<br/>" +
          stats.losses + "<br/>" +
          stats.pct;

        return label;
      }
    },
    xAxis: {
      categories: labels,
      labels: {
        formatter: function() {
          var year = this.value,
              season = _.detect( seasons, function( s ) { return s.year === year } );
          if( this.isFirst || this.isLast ) {
            return season[x_prop];
          }
        },
        y: 18
      },
      lineColor:      "rgba(0,0,0,0.1)",
      tickWidth:      0,
      showFirstLabel: true,
      showLastLabel:  true,
      title:          "Wins"
    },
    yAxis: {
      gridLineColor:  "rgba(0,0,0,0.1)",
      endOnTick:      false,
      max:            max_y,
      min:            0,
      showFirstLabel: false,
      title:          "Wins"
    }
  } );
}

function selectSortLink() {
  $("#sort li").removeClass( "selected" ).each( function() {
    var a = $(this).find( "a" ).get(0);
    if( a.hash === "#" + getSortProperty() ) {
      $(this).addClass( "selected" );
    }
  } );
}

$(document).ready( function() {
  $(window).bind( "hashchange", render );

  $.getJSON( "seasons.json", function( data ) {
    seasons = calcWinPct( data );
    render();
  } );
} );
