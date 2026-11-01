// Native React page. Data contract: docs/delivery.
import { Fragment, cssStyle, Partial } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"toolbar-print"}>
        <button className={"btn btn-dark"} onClick={() => window.print()}>
          {"Print / save as PDF"}
        </button>
      </div>
      {"\n"}
      <div className={"doc"}>
        {"\n  "}
        <Partial part={data.part1} state={state} />
        {"\n  "}
        <table>
          <thead>
            <tr>
              <th>{"Item"}</th>
              <th className={"num"}>{"Qty"}</th>
              <th>{"Serial numbers"}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows2?.length ? (
              data.rows2.map((row2, index) => (
                <Fragment key={index}>
                  <tr>
                    <td>{row2.v3}</td>
                    <td className={"num"}>{row2.v4}</td>
                    <td className={"mono"} style={cssStyle("font-size:11px")}>
                      {row2.v5}
                    </td>
                  </tr>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </tbody>
        </table>
        {"\n  "}
        <p>
          {"Vehicle: "}
          <b>{data.v6}</b>
          {" · Driver: "}
          <b>{data.v7}</b>
          {" · Dispatched "}
          {data.v8}
        </p>
        {"\n  "}
        {data.choice9 === 0 ? (
          <>
            <p>
              {"Delivered "}
              {data.v10}
              {data.choice11 === 0 ? (
                <>
                  {", received by "}
                  <b>{data.v12}</b>
                </>
              ) : null}
              {". Warranty starts from the delivery date."}
            </p>
            {"\n  "}
          </>
        ) : data.choice9 === 1 ? (
          <>
            <p style={cssStyle("margin-top:2.5rem")}>
              {"Received by: ______________________   Date: ____________"}
            </p>
          </>
        ) : null}
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
