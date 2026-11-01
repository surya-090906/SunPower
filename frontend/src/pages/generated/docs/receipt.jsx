// Native React page. Data contract: docs/receipt.
import { cssStyle, Partial } from "@ui/runtime";
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
        <p style={cssStyle("font-size:1.1rem")}>
          {"Received with thanks "}
          <b>{data.v2}</b>
          {" from "}
          <b>{data.v3}</b>
          {"."}
        </p>
        {"\n  "}
        <table>
          <tbody>
            <tr>
              <th style={cssStyle("width:30%")}>{"Towards"}</th>
              <td>{data.v4}</td>
            </tr>
            <tr>
              <th>{"Method"}</th>
              <td>
                {data.v5}
                {data.choice6 === 0 ? (
                  <>
                    {" · reference "}
                    {data.v7}
                  </>
                ) : null}
              </td>
            </tr>
            <tr>
              <th>{"Received on"}</th>
              <td>{data.v8}</td>
            </tr>
            <tr>
              <th>{"Total paid so far"}</th>
              <td>{data.v9}</td>
            </tr>
          </tbody>
        </table>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
