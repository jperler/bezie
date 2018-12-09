import React, { Component, PropTypes } from "react";
import classNames from "classnames";

class Point extends Component {
  static propTypes = {
    onMouseDown: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    x: PropTypes.number,
    y: PropTypes.number,
    selected: PropTypes.bool,
    dragging: PropTypes.bool,
    color: PropTypes.string.isRequired
  };

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.x !== this.props.x ||
      nextProps.y !== this.props.y ||
      nextProps.selected !== this.props.selected ||
      nextProps.dragging !== this.props.dragging ||
      nextProps.color !== this.props.color
    );
  }

  render() {
    const { onMouseDown, onDoubleClick, selected, x, y, color } = this.props;

    return (
      <circle
        className={classNames("point", { selected })}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        r={5}
        cx={x}
        cy={y}
        stroke={color}
        fill={color}
      />
    );
  }
}

export default Point;
