import React, { Component, PropTypes } from "react";
import styles from "./bars.css";

class Bars extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    bars: PropTypes.number.isRequired
  };

  render() {
    const { width, height, bars } = this.props;
    const barWidth = width / bars;

    return (
      <g>
        <defs id="svg-defs">
          <pattern id="bars" width={barWidth * 2} height="12" patternUnits="userSpaceOnUse">
            <rect className={styles.odd} width={barWidth} height="12" />
            <rect className={styles.even} x={barWidth} width={barWidth} height="12" />
          </pattern>
        </defs>
        <rect fill="url(#bars)" height={height} width={width} />
      </g>
    );
  }
}

export default Bars;
