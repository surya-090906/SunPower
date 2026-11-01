// Native React page. Data contract: docs/label.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <style>
        {
          '\n@page {\n  size: 3.5in 2.2in;\n  margin: 0.1in;\n}\n.asset-label-page {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;\n  background: #f8fafc;\n  color: #0f172a;\n  margin: 0;\n  padding: 1.5rem;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.actions {\n  margin-bottom: 1rem;\n}\n.btn {\n  display: inline-block;\n  background: #0284c7;\n  color: #fff;\n  padding: .5rem 1rem;\n  border-radius: 6px;\n  text-decoration: none;\n  font-weight: 600;\n  font-size: .9rem;\n  border: none;\n  cursor: pointer;\n}\n.label-card {\n  width: 3.3in;\n  height: 2.0in;\n  border: 2px dashed #94a3b8;\n  border-radius: 8px;\n  background: #fff;\n  padding: .5rem .7rem;\n  box-sizing: border-box;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n}\n.header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  border-bottom: 1.5px solid #0f172a;\n  padding-bottom: .25rem;\n}\n.co-name {\n  font-weight: 800;\n  font-size: .85rem;\n  letter-spacing: .5px;\n  text-transform: uppercase;\n  color: #0284c7;\n}\n.tag-badge {\n  font-size: .65rem;\n  font-weight: 700;\n  background: #0f172a;\n  color: #fff;\n  padding: 1px 5px;\n  border-radius: 3px;\n}\n.prod-info {\n  margin-top: .2rem;\n}\n.prod-name {\n  font-size: .82rem;\n  font-weight: 700;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.serial-box {\n  margin: .2rem 0;\n  text-align: center;\n}\n.serial-no {\n  font-family: "Courier New", Courier, monospace;\n  font-size: 1.15rem;\n  font-weight: 800;\n  letter-spacing: 2px;\n}\n.barcode-svg {\n  width: 90%;\n  height: 24px;\n  margin: 2px auto 0;\n  display: block;\n}\n.meta-row {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-end;\n  font-size: .68rem;\n  border-top: 1px solid #e2e8f0;\n  padding-top: .25rem;\n  color: #475569;\n}\n@media print {\n  .asset-label-page {\n    background: #fff;\n    padding: 0;\n  }\n  .actions {\n    display: none;\n  }\n  .label-card {\n    border: none;\n    box-shadow: none;\n    width: 100%;\n    height: 100%;\n    padding: .1in;\n  }\n}\n'
        }
      </style>
      <div className={"asset-label-page"}>
        {"\n  "}
        <div className={"actions"}>
          {"\n    "}
          <button className={"btn"} onClick={() => window.print()}>
            {"🖨️ Print Label"}
          </button>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"label-card"}>
          {"\n    "}
          <div className={"header"}>
            {"\n      "}
            <span className={"co-name"}>{data.v1}</span>
            {"\n      "}
            <span className={"tag-badge"}>{"ASSET TAG"}</span>
            {"\n    "}
          </div>
          {"\n    "}
          <div className={"prod-info"}>
            {"\n      "}
            <div className={"prod-name"}>{data.v2}</div>
            {"\n      "}
            <div style={cssStyle("font-size:.68rem;color:#64748b")}>
              {data.v3}
              {" · "}
              {data.v4}
            </div>
            {"\n    "}
          </div>
          {"\n    "}
          <div className={"serial-box"}>
            {"\n      "}
            <div className={"serial-no"}>{data.v5}</div>
            {"\n      "}
            <svg
              className={"barcode-svg"}
              viewBox={"0 0 " + text(data.v6) + " 24"}
              preserveAspectRatio={"none"}
            >
              {"\n        "}
              {data.rows7?.length ? (
                data.rows7.map((row7, index) => (
                  <Fragment key={index}>
                    {"\n          "}
                    <rect
                      x={text(row7.v8)}
                      y={"0"}
                      width={text(row7.v9)}
                      height={"24"}
                      fill={"#000"}
                    />
                    {"\n        "}
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n      "}
            </svg>
            {"\n    "}
          </div>
          {"\n    "}
          <div className={"meta-row"}>
            {"\n      "}
            <div>
              {"\n        "}
              {data.choice10 === 0 ? (
                <>
                  {"\n          "}
                  <b>{data.v11}</b>
                  {" · "}
                  {data.v12}
                  {"\n        "}
                </>
              ) : data.choice10 === 1 ? (
                <>
                  {"\n          "}
                  <b>{"IN WAREHOUSE STOCK"}</b>
                  {"\n        "}
                </>
              ) : null}
              {"\n      "}
            </div>
            {"\n      "}
            <div style={cssStyle("text-align:right")}>
              {"\n        "}
              {data.choice13 === 0 ? (
                <>
                  {"\n          WTY: "}
                  <b>{data.v14}</b>
                  {"\n        "}
                </>
              ) : data.choice13 === 1 ? (
                <>
                  {"\n          WTY: "}
                  <b>
                    {data.v15}
                    {" mo"}
                  </b>
                  {"\n        "}
                </>
              ) : null}
              {"\n      "}
            </div>
            {"\n    "}
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
    </>
  );
}
