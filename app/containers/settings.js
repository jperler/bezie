import { connect } from "react-redux";
import Settings from "../components/settings";
import * as bezieActions from "../actions/bezie";

function mapStateToProps(state) {
  return {
    settings: state.bezie.settings
  };
}

export default connect(
  mapStateToProps,
  bezieActions
)(Settings);
