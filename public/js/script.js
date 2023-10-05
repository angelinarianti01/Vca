function createProgressChart(data) {
    // Get data
    const results = {
      'latent': {
        'width':'30%',
        'bgColor': 'linear-gradient(to right, #FF5A36, #FFA292)',
        'hoverBgColor': 'linear-gradient(to right, #f27e64, #e8bfb8)'
      },
      'emerging': {
        'width':'50%',
        'bgColor': 'linear-gradient(to right, #FFC42D, #FFEF60)',
        'hoverBgColor': 'linear-gradient(to right, #f27e64, #e8bfb8)'
      },
      'mature': {
        'width':'20%',
        'bgColor': 'linear-gradient(to right, #61C270, #61C270)',
        'hoverBgColor': 'linear-gradient(to right, #f27e64, #e8bfb8)'
      }
    }  
  
    // Create main container
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');
    progressContainer.style.width = '80%';
    progressContainer.style.margin = '20px auto';
  
    // Create progress bar outer container
    const progressBarOuter = document.createElement('div');
    progressBarOuter.classList.add('progress-bar-outer');
    progressBarOuter.style.backgroundColor = '#F3F3F3';
    progressBarOuter.style.height = '30px';
    progressBarOuter.style.borderRadius = '50px';
    progressBarOuter.style.padding = '5px';
    progressBarOuter.style.paddingLeft = '12px';
    progressBarOuter.style.paddingRight = '12px';
    progressBarOuter.style.display = 'flex';
    progressBarOuter.style.alignItems = 'center';
    progressBarOuter.style.boxShadow = '4px 4px 10px rgba(0, 0, 0, 0.5)';
  
    // Create inner bar 
    for (const r in results) {
      console.log(r)
      // Inner bar
      const innerBar = document.createElement('div');
      innerBar.classList.add('inner', r, `${r}-bar`);
  
      // Style inner bar
      innerBar.style.height = '75%';
      innerBar.style.transition = 'width 0.3s ease-in-out';
      innerBar.style.borderRadius = '50px';
      innerBar.style.margin = '2px';
      innerBar.style.width = results[r].width;    
      innerBar.style.backgroundImage= results[r].bgColor;
  
      // Style on mouse enter
      innerBar.addEventListener('mouseenter', () => {
        innerBar.style.backgroundImage = results[r].hoverBgColor;
      });
  
      // Style on mouse leave
      innerBar.addEventListener('mouseleave', () => {
        innerBar.style.backgroundImage= results[r].bgColor;
      });
  
      // Append
      progressBarOuter.appendChild(innerBar);    
    }
  
    // Create vertical lines
    const verticalLineContainer = document.createElement('div');
    verticalLineContainer.classList.add('vertical-line');
    verticalLineContainer.style.display = 'flex';
    verticalLineContainer.style['text-align'] = 'center';
  
    // Style vertical lines
    for (const r in results) {
      const line = document.createElement('div');
      line.classList.add('line', r);
      line.style.borderLeft = '1px solid #000'; // Adjust thickness and color as needed
      line.style.height = '10px'; // Adjust height as needed
      line.style.transform = 'translateX(50%)';
      line.style.width = results[r].width;
      verticalLineContainer.appendChild(line);
    }
  
    // Create x-axis labels
    const xAxisLabels = document.createElement('div');
    xAxisLabels.classList.add('x-axis-labels');
    xAxisLabels.style.display = 'flex';
    xAxisLabels.style['text-align'] = 'center';  
  
    // Style x-axis labels
    for (const r in results) {
      const label = document.createElement('span');
      label.classList.add(r.toLowerCase());
      label.textContent = r;
      label.style.width = results[r].width;
      xAxisLabels.appendChild(label);
    }
  
    // Append elements to the main container
    progressContainer.appendChild(progressBarOuter);
    progressContainer.appendChild(verticalLineContainer);
    progressContainer.appendChild(xAxisLabels);
  
    // Return the generated HTML structure
    return progressContainer;
  }
  
  
  
// Create radial chart
const insertRadialChart = (containerId, label, color, bgColor, chartHeight, hollowSize, hollowBg, percentage) => {
    
    // Init chart options
    const chartOptions =  
        {
            series: [percentage],
            colors: [color],
            chart: {
            height: chartHeight,
            // width: "100%",
            type: "radialBar",
            sparkline: {
                enabled: true,
            },
            },
            plotOptions: {
            radialBar: {
                track: {
                background: bgColor,                
                },
                dataLabels: {
                  name: {             
                    show: true,
                    fontSize: 20,                                       
                  },
                  value: {   
                    show: false,                  
                  },                
                },
                hollow: {
                  margin: 0,
                  size: hollowSize,
                  background: hollowBg
                },              
            },
            },     
            stroke: {
                lineCap: "round",
            },       
            labels: [label],
            tooltip: {
              enabled: false,
            }          
        }

// Get container
var chart = new ApexCharts(document.querySelector(`#${containerId}`), chartOptions);
chart.render();
}


// Create radial chart
const insertVennRadialChart = (containerId, label, color, bgColor, chartHeight, hollowSize, hollowBg, percentage) => {
  // Init chart options
  const chartOptions =  
  {
      series: [percentage],
      colors: [color],
      chart: {
      height: chartHeight,
      // width: "100%",
      type: "radialBar",
      sparkline: {
          enabled: true,
      },
      },
      plotOptions: {
      radialBar: {
          track: {
          background: bgColor,                
          },
          dataLabels: {
            name: {             
              fontSize: '20px',
              color: color,                 
              show: true,
            },
            value: {   
              show: false                                  
            },                
          },
          hollow: {
            margin: 0,
            size: hollowSize,
            background: hollowBg
          },              
      },
      },     
      stroke: {
          lineCap: "round",
      },       
      labels: [label],
      tooltip: {
        enabled: false,
      }          
  }

// Get container
var chart = new ApexCharts(document.querySelector(`#${containerId}`), chartOptions);
chart.render();
}


// Create half radial chart
const insertHalfRadialChart = (containerId, label, color, bgColor, chartHeight, hollowSize, percentage) => {
  // Make sure apex chart is imported
  if (typeof ApexCharts == 'undefined') {
    return;
  }

  // Init chart options
  const chartOptions =  
  {
    series: [percentage],
    colors: [color],
    chart: {
      height: chartHeight,   
      // width: "100%",
      type: "radialBar",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90, // Start angle for the half radial chart
        endAngle: 90,   // End angle for the half radial chart
        track: {
          background: bgColor,                
        },
        dataLabels: {
          name: {
            fontSize: '28px',
            color: '#000000',
            offsetY: -25,   
            show: true,
          },
          value: {
            fontSize: '24px', 
            offsetY: -45,
            show: false,
          },
        },
        hollow: {
          margin: 0,
          size: hollowSize,
        },              
      },
    },     

    labels: [label],
    tooltip: {
      enabled: false,
    },
  }

  // Get container
  var chart = new ApexCharts(document.querySelector(`#${containerId}`), chartOptions);
  chart.render();
}
  
// Card
const createCard = (id, className, width, bgColor, boxShadow, borderRadius) => {
    // Create the card element
    const card = document.createElement('div');
    card.id = id;
    card.className = className;
    card.style.width = width;
    card.style.background = bgColor;
    card.style['border-radius'] = borderRadius;
    card.style['box-shadow'] = boxShadow

    return card;
}